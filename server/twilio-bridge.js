/**
 * Twilio ↔ Gemini Live API WebSocket Bridge
 *
 * Standalone Node.js server that:
 *   1. Accepts Twilio Media Stream WebSocket connections on port 3001
 *   2. Opens a parallel WebSocket to Google Gemini Multimodal Live API
 *   3. Converts audio bidirectionally (mulaw 8kHz ↔ linear PCM 16kHz/24kHz)
 *   4. Handles Gemini tool calls by querying Supabase REST API
 *   5. Saves call transcript, duration, and summary when the call ends
 *
 * Usage:
 *   node server/twilio-bridge.js
 *
 * Requires:  npm install ws
 */

const path = require('path');
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');

// ---------------------------------------------------------------------------
// 1. Load environment from .env.local
// ---------------------------------------------------------------------------
const envPath = path.join(__dirname, '..', '.env.local');
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
  console.log('[env] Loaded .env.local');
} catch (err) {
  console.warn('[env] Could not read .env.local – relying on existing env vars');
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[env] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!GEMINI_API_KEY) {
  console.error('[env] Missing NEXT_PUBLIC_GEMINI_API_KEY');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Audio format conversion helpers
// ---------------------------------------------------------------------------

/**
 * µ‑law expansion table (ITU‑T G.711).
 * Convert a single µ‑law byte (0–255) → signed 16‑bit linear PCM sample.
 */
function mulawToLinear(mulawByte) {
  // Complement
  mulawByte = ~mulawByte & 0xff;

  const sign = mulawByte & 0x80;
  const exponent = (mulawByte >> 4) & 0x07;
  const mantissa = mulawByte & 0x0f;

  // Reconstruct magnitude
  let magnitude = ((mantissa << 1) | 0x21) << (exponent + 2);
  magnitude -= 0x84; // bias removal

  return sign ? -magnitude : magnitude;
}

/**
 * Compress a signed 16‑bit linear PCM sample → µ‑law byte (ITU‑T G.711).
 */
function linearToMulaw(sample) {
  const MAX = 0x7fff;
  const BIAS = 0x84;
  const CLIP = 32635;

  // Determine sign
  let sign = 0;
  if (sample < 0) {
    sign = 0x80;
    sample = -sample;
  }

  if (sample > CLIP) sample = CLIP;
  sample += BIAS;

  // Find exponent (segment)
  let exponent = 7;
  const exponentMask = 0x4000;
  for (let i = 0; i < 8; i++) {
    if (sample & (exponentMask >> i)) {
      exponent = 7 - i;
      break;
    }
  }

  // Extract mantissa
  const mantissa = (sample >> (exponent + 3)) & 0x0f;

  // Combine and complement
  const mulawByte = ~(sign | (exponent << 4) | mantissa) & 0xff;
  return mulawByte;
}

/**
 * Resample an array of 16‑bit PCM samples using linear interpolation.
 * @param {Int16Array} inputSamples
 * @param {number} fromRate  e.g. 8000
 * @param {number} toRate    e.g. 16000
 * @returns {Int16Array}
 */
function resample(inputSamples, fromRate, toRate) {
  if (fromRate === toRate) return inputSamples;

  const ratio = fromRate / toRate;
  const outputLength = Math.round(inputSamples.length / ratio);
  const output = new Int16Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const indexFloor = Math.floor(srcIndex);
    const indexCeil = Math.min(indexFloor + 1, inputSamples.length - 1);
    const fraction = srcIndex - indexFloor;

    // Linear interpolation between two nearest samples
    output[i] = Math.round(
      inputSamples[indexFloor] * (1 - fraction) + inputSamples[indexCeil] * fraction
    );
  }

  return output;
}

/**
 * Convert Twilio audio → Gemini audio.
 *   base64(µ‑law 8 kHz) → base64(linear PCM 16 kHz)
 */
function convertTwilioToGemini(base64Mulaw) {
  // 1. Decode base64 → raw bytes
  const mulawBuffer = Buffer.from(base64Mulaw, 'base64');

  // 2. µ‑law → 16‑bit linear PCM (still 8 kHz)
  const pcm8k = new Int16Array(mulawBuffer.length);
  for (let i = 0; i < mulawBuffer.length; i++) {
    pcm8k[i] = mulawToLinear(mulawBuffer[i]);
  }

  // 3. Resample 8 kHz → 16 kHz
  const pcm16k = resample(pcm8k, 8000, 16000);

  // 4. Encode as base64
  return Buffer.from(pcm16k.buffer, pcm16k.byteOffset, pcm16k.byteLength).toString('base64');
}

/**
 * Convert Gemini audio → Twilio audio.
 *   base64(linear PCM 24 kHz) → base64(µ‑law 8 kHz)
 */
function convertGeminiToTwilio(base64Pcm) {
  // 1. Decode base64 → raw 16‑bit PCM bytes
  const pcmBuffer = Buffer.from(base64Pcm, 'base64');
  const pcm24k = new Int16Array(
    pcmBuffer.buffer,
    pcmBuffer.byteOffset,
    pcmBuffer.byteLength / 2
  );

  // 2. Resample 24 kHz → 8 kHz
  const pcm8k = resample(pcm24k, 24000, 8000);

  // 3. Linear PCM → µ‑law
  const mulawBytes = Buffer.alloc(pcm8k.length);
  for (let i = 0; i < pcm8k.length; i++) {
    mulawBytes[i] = linearToMulaw(pcm8k[i]);
  }

  // 4. Encode as base64
  return mulawBytes.toString('base64');
}

// ---------------------------------------------------------------------------
// 3. Supabase REST helpers (no SDK – plain HTTP for the bridge process)
// ---------------------------------------------------------------------------

/**
 * Make a request to the Supabase REST API (PostgREST).
 */
async function supabaseRequest(method, table, params = {}) {
  const { query = '', body = null } = params;

  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`;

  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: method === 'POST' ? 'return=representation' : 'return=representation',
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase ${method} ${table} failed (${response.status}): ${text}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return null;
}

// ---------------------------------------------------------------------------
// 4. Tool‑call handlers (mirror the function declarations sent to Gemini)
// ---------------------------------------------------------------------------

async function handleGetBusinessInfo(businessId) {
  try {
    // Fetch business
    const businesses = await supabaseRequest('GET', 'businesses', {
      query: `id=eq.${businessId}&select=name`,
    });
    const businessName = businesses?.[0]?.name || 'Our Business';

    // Fetch services
    const services = await supabaseRequest('GET', 'services', {
      query: `business_id=eq.${businessId}&select=name,price,duration`,
    });

    // Fetch FAQs
    const faqs = await supabaseRequest('GET', 'faqs', {
      query: `business_id=eq.${businessId}&select=question,answer`,
    });

    return {
      business_name: businessName,
      services: services || [],
      faqs: faqs || [],
    };
  } catch (err) {
    console.error('[tool] get_business_info error:', err.message);
    return { error: err.message };
  }
}

async function handleGetAvailableSlots(businessId, date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await supabaseRequest('GET', 'appointments', {
      query: [
        `business_id=eq.${businessId}`,
        `start_time=gte.${startOfDay.toISOString()}`,
        `start_time=lte.${endOfDay.toISOString()}`,
        `status=neq.cancelled`,
        `select=start_time`,
      ].join('&'),
    });

    const allSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30',
    ];

    if (!bookings || bookings.length === 0) return { slots: allSlots };

    const bookedHours = bookings.map(b => {
      const d = new Date(b.start_time);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    });

    return { slots: allSlots.filter(s => !bookedHours.includes(s)) };
  } catch (err) {
    console.error('[tool] get_available_slots error:', err.message);
    return { error: err.message };
  }
}

async function handleBookAppointment(businessId, args) {
  try {
    const { customer_name, customer_phone, service_name, date, time } = args;

    // Resolve service id by name
    const services = await supabaseRequest('GET', 'services', {
      query: `business_id=eq.${businessId}&name=ilike.*${encodeURIComponent(service_name)}*&select=id,name`,
    });

    const serviceId = services?.[0]?.id || null;
    const startTime = new Date(`${date}T${time}:00`).toISOString();

    // Duplicate check — prevent Gemini from booking twice
    const existing = await supabaseRequest('GET', 'appointments', {
      query: `business_id=eq.${businessId}&customer_name=eq.${encodeURIComponent(customer_name)}&customer_phone=eq.${encodeURIComponent(customer_phone)}&start_time=eq.${encodeURIComponent(startTime)}&select=id`,
    });

    if (existing && existing.length > 0) {
      console.log(`[tool] Duplicate appointment detected, returning existing id=${existing[0].id}`);
      return {
        success: true,
        message: 'Appointment already booked!',
        booking_id: existing[0].id,
      };
    }

    const result = await supabaseRequest('POST', 'appointments', {
      body: {
        business_id: businessId,
        customer_name,
        customer_phone,
        service_id: serviceId,
        start_time: startTime,
        notes: 'Booked via Twilio Voice AI Agent',
      },
    });

    return {
      success: true,
      message: 'Appointment booked successfully!',
      booking_id: result?.[0]?.id,
    };
  } catch (err) {
    console.error('[tool] book_appointment error:', err.message);
    return { success: false, error: err.message };
  }
}

// ---------------------------------------------------------------------------
// 5. Per‑call session – manages one Twilio ↔ Gemini bridge
// ---------------------------------------------------------------------------

class CallSession {
  constructor(twilioWs, params) {
    this.twilioWs = twilioWs;
    this.geminiWs = null;

    // Custom parameters injected by TwiML <Stream>
    this.agentId = params.agentId || null;
    this.callId = params.callId || null;
    this.businessId = params.businessId || null;
    this.streamSid = null;

    // Transcript collection
    this.transcript = [];
    this.startTime = Date.now();

    // Whether the Gemini setup message has been acknowledged
    this.geminiReady = false;

    // Buffer Twilio audio until Gemini is ready
    this.audioQueue = [];

    // Buffer to accumulate audio to reduce packet transmission rate
    this.twilioAudioBuffer = [];

    console.log(`[session] Created – agent=${this.agentId} call=${this.callId} business=${this.businessId}`);
  }

  // ------- Gemini connection -------

  async connectToGemini() {
    return new Promise((resolve, reject) => {
      const url =
        `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${GEMINI_API_KEY}`;

      console.log('[gemini] Opening WebSocket connection …');
      this.geminiWs = new WebSocket(url);

      this.geminiWs.on('open', async () => {
        console.log('[gemini] Connected');
        await this._sendGeminiSetup();
        resolve();
      });

      this.geminiWs.on('message', (raw) => this._onGeminiMessage(raw));

      this.geminiWs.on('error', (err) => {
        console.error('[gemini] WebSocket error:', err.message);
        this.cleanup();
        reject(err);
      });

      this.geminiWs.on('close', (code, reason) => {
        console.log(`[gemini] Disconnected (code=${code} reason=${reason})`);
        this.cleanup();
      });
    });
  }

  async _sendGeminiSetup() {
    // Fetch agent config from Supabase to build the system prompt
    let systemPrompt = 'You are a helpful AI phone receptionist. Be concise since this is a phone call.';
    let voiceName = 'Aoede';

    try {
      let agents = [];
      if (this.agentId) {
        agents = await supabaseRequest('GET', 'agents', {
          query: `id=eq.${this.agentId}&is_active=eq.true&select=*,business:businesses(name,gemini_api_key)`,
        });
      }

      // Fallback: If no agent loaded (e.g. inbound call without params), load the first active agent in the system
      if (!agents || agents.length === 0) {
        agents = await supabaseRequest('GET', 'agents', {
          query: `is_active=eq.true&select=*,business:businesses(name,gemini_api_key)`,
        });
      }

      if (agents && agents.length > 0) {
        const agent = agents[0];
        const businessName = agent.business?.name || 'Our Business';
        voiceName = agent.voice || 'Aoede';
        this.agentId = agent.id;
        this.businessId = this.businessId || agent.business_id;

        systemPrompt = [
          agent.system_prompt,
          `Your name is ${agent.name}. You are the receptionist for ${businessName}. Tone: ${agent.tonality}.`,
          'GREETING RULE: Start with ONLY: "Hi, I\'m ${agent.name}. Which language are you comfortable with?" — nothing else. No listing languages. No elaboration.',
          'Once they say a language, IMMEDIATELY switch to that language and ask "How can I help you?" — no delay, no confirmation, no repeating their choice.',
          'SPEED RULE: Keep ALL responses under 2 sentences. Be direct. No filler words. No "Sure!", "Of course!", "Absolutely!" — just answer.',
          'Always use the get_business_info tool first to fetch services, pricing, and FAQs to answer business questions.',
          'BUSINESS SERVICES RULE: ONLY mention the exact services returned by the get_business_info tool. If the tool returns no services, state "We currently have no services listed." Do NEVER hallucinate, guess, or make up services based on the industry name. NEVER offer generic services.',
          'BOOKING RULE 1: Before calling book_appointment, you MUST ask the customer for their FULL NAME and PHONE NUMBER.',
          'BOOKING RULE 2: Only call book_appointment AFTER the customer provides their name, phone number, desired service, date, and time. You MUST actually trigger the `book_appointment` function call to save the booking! Do not just say you booked it without calling the tool.',
          'IMPORTANT: Always quote all prices and amounts in Indian Rupees (₹ / INR). Never use dollars. Say "999 rupees", never "$49".',
          'TELUGU ACCENT RULE: Speak polite, natural, modern conversational Telugu (e.g., "నమస్తే, నా పేరు..., నేను మీకు ఎలా సహాయపడగలను?"). Do NOT use overly formal or ancient Granthika Telugu. Use clear, respectful language that a modern receptionist would use.',
          'OTHER BUSINESS RULE: If the business identity is unrecognized or the business is \'Other\', politely ask the user to provide their Business Name and list their primary services.',
        ].join('\n');

        console.log(`[gemini] Agent "${agent.name}" loaded – voice=${voiceName}`);
      }
    } catch (err) {
      console.warn('[gemini] Could not load agent config, using defaults:', err.message);
    }

    const setupMsg = {
      setup: {
        model: 'models/gemini-3.1-flash-live-preview',
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName,
              },
            },
          },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        tools: [
          {
            functionDeclarations: [
              {
                name: 'get_business_info',
                description:
                  'Get details about the business including available services, durations, prices, and FAQs.',
                parameters: { type: 'OBJECT', properties: {} },
              },
              {
                name: 'get_available_slots',
                description:
                  'Get a list of available HH:MM booking slots for a given YYYY-MM-DD date.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    date: { type: 'STRING', description: 'The booking date (YYYY-MM-DD).' },
                  },
                  required: ['date'],
                },
              },
              {
                name: 'book_appointment',
                description: 'Schedule a booking for the customer in the database.',
                parameters: {
                  type: 'OBJECT',
                  properties: {
                    customer_name: { type: 'STRING', description: 'First and last name of the customer.' },
                    customer_phone: { type: 'STRING', description: 'Customer callback phone number.' },
                    service_name: { type: 'STRING', description: 'Name of the service to schedule.' },
                    date: { type: 'STRING', description: 'Reservation date (YYYY-MM-DD).' },
                    time: { type: 'STRING', description: 'Reservation slot time (HH:MM).' },
                  },
                  required: ['customer_name', 'customer_phone', 'service_name', 'date', 'time'],
                },
              },
            ],
          },
        ],
      },
    };

    this.geminiWs.send(JSON.stringify(setupMsg));
    console.log('[gemini] Setup message sent');
  }

  triggerGreeting() {
    if (!this.geminiWs || this.geminiWs.readyState !== WebSocket.OPEN) return;
    
    console.log('[gemini] Sending trigger text to start greeting');
    const triggerMsg = {
      clientContent: {
        turns: [
          {
            role: 'user',
            parts: [
              { text: 'Hello, please start the call now by greeting the customer warmly and asking for their language preference as instructed in your system prompt.' }
            ]
          }
        ],
        turnComplete: true
      }
    };
    this.geminiWs.send(JSON.stringify(triggerMsg));
  }

  // ------- Gemini → Twilio (audio + tool calls) -------

  _onGeminiMessage(raw) {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    // Setup acknowledgement
    if (msg.setupComplete) {
      console.log('[gemini] Setup complete – ready for audio');
      this.geminiReady = true;
      // Flush any buffered Twilio audio
      this._flushAudioQueue();
      // Trigger greeting speech
      this.triggerGreeting();
      return;
    }

    // Audio response chunks
    const part = msg.serverContent?.modelTurn?.parts?.[0];
    if (part?.inlineData?.data) {
      this._forwardGeminiAudioToTwilio(part.inlineData.data);
    }

    // Output transcript (agent's speech → text)
    const outputTranscript = msg.serverContent?.outputTranscription?.text;
    if (outputTranscript) {
      // Accumulate into current agent turn
      if (!this._currentAgentText) this._currentAgentText = '';
      this._currentAgentText += outputTranscript;
    }

    // Input transcript (user's speech → text)  
    const inputTranscript = msg.serverContent?.inputTranscription?.text;
    if (inputTranscript) {
      // Accumulate into current user turn
      if (!this._currentUserText) this._currentUserText = '';
      this._currentUserText += inputTranscript;
    }

    // Also capture any text parts (fallback)
    if (part?.text) {
      if (!this._currentAgentText) this._currentAgentText = '';
      this._currentAgentText += part.text;
    }

    // Turn complete — flush accumulated text
    if (msg.serverContent?.turnComplete) {
      if (this._currentUserText) {
        this.transcript.push({ role: 'user', text: this._currentUserText.trim(), timestamp: new Date().toISOString() });
        console.log(`[transcript] USER: ${this._currentUserText.trim()}`);
        this._currentUserText = '';
      }
      if (this._currentAgentText) {
        this.transcript.push({ role: 'model', text: this._currentAgentText.trim(), timestamp: new Date().toISOString() });
        console.log(`[transcript] AGENT: ${this._currentAgentText.trim()}`);
        this._currentAgentText = '';
      }
    }

    // Tool calls
    if (msg.toolCall) {
      this._handleToolCall(msg.toolCall);
    }
  }

  _forwardGeminiAudioToTwilio(base64Pcm24k) {
    if (!this.twilioWs || this.twilioWs.readyState !== WebSocket.OPEN) return;
    if (!this.streamSid) return;

    try {
      const base64Mulaw = convertGeminiToTwilio(base64Pcm24k);

      const mediaMessage = {
        event: 'media',
        streamSid: this.streamSid,
        media: {
          payload: base64Mulaw,
        },
      };

      this.twilioWs.send(JSON.stringify(mediaMessage));
    } catch (err) {
      console.error('[audio] Gemini→Twilio conversion error:', err.message);
    }
  }

  // ------- Tool‑call handling -------

  async _handleToolCall(toolCall) {
    const { functionCalls } = toolCall;
    if (!functionCalls || functionCalls.length === 0) return;

    const functionResponses = [];

    for (const call of functionCalls) {
      const { name, id, args } = call;
      let output = { error: 'Unknown function' };

      console.log(`[tool] Executing ${name}(${JSON.stringify(args)})`);

      try {
        if (name === 'get_business_info') {
          output = await handleGetBusinessInfo(this.businessId);
        } else if (name === 'get_available_slots') {
          output = await handleGetAvailableSlots(this.businessId, args.date);
        } else if (name === 'book_appointment') {
          output = await handleBookAppointment(this.businessId, args);
        }
      } catch (err) {
        output = { error: err.message || 'Tool execution failed' };
      }

      console.log(`[tool] ${name} → ${JSON.stringify(output).slice(0, 200)}`);

      functionResponses.push({
        name,
        id,
        response: { output },
      });
    }

    // Send responses back to Gemini
    if (this.geminiWs && this.geminiWs.readyState === WebSocket.OPEN) {
      this.geminiWs.send(
        JSON.stringify({ toolResponse: { functionResponses } })
      );
      console.log('[tool] Responses sent to Gemini');
    }
  }

  // ------- Twilio → Gemini (audio) -------

  onTwilioMessage(data) {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }

    switch (msg.event) {
      case 'connected':
        console.log('[twilio] Stream connected');
        break;

      case 'start':
        this.streamSid = msg.start.streamSid;
        console.log(`[twilio] Stream started – streamSid=${this.streamSid}`);

        // Extract custom parameters from TwiML <Stream> <Parameter> tags
        if (msg.start.customParameters) {
          this.agentId = msg.start.customParameters.agentId || this.agentId;
          this.callId = msg.start.customParameters.callId || this.callId;
          this.businessId = msg.start.customParameters.businessId || this.businessId;
          console.log(`[twilio] Custom params: agentId=${this.agentId} callId=${this.callId} businessId=${this.businessId}`);
        }

        // Now that we have the agentId, open Gemini connection
        this.connectToGemini().catch(err => {
          console.error('[session] Failed to connect to Gemini:', err.message);
          this.cleanup();
        });
        break;

      case 'media':
        this._forwardTwilioAudioToGemini(msg.media.payload);
        break;

      case 'stop':
        console.log('[twilio] Stream stopped');
        this._onCallEnd();
        break;

      default:
        // mark, dtmf, etc. – ignored
        break;
    }
  }

  _forwardTwilioAudioToGemini(base64Mulaw) {
    // Buffer until Gemini is ready
    if (!this.geminiReady) {
      this.audioQueue.push(base64Mulaw);
      return;
    }

    if (!this.geminiWs || this.geminiWs.readyState !== WebSocket.OPEN) return;

    try {
      const chunk = Buffer.from(base64Mulaw, 'base64');
      this.twilioAudioBuffer.push(chunk);

      const totalBytes = this.twilioAudioBuffer.reduce((acc, b) => acc + b.length, 0);
      if (totalBytes < 400) {
        return; // Wait for more audio (50ms threshold)
      }

      const concatenated = Buffer.concat(this.twilioAudioBuffer);
      const chunkToSend = concatenated.slice(0, 400);
      const remainder = concatenated.slice(400);
      this.twilioAudioBuffer = remainder.length > 0 ? [remainder] : [];

      const base64Pcm16k = convertTwilioToGemini(chunkToSend.toString('base64'));

      this.geminiWs.send(
        JSON.stringify({
          realtimeInput: {
            audio: {
              mimeType: 'audio/pcm;rate=16000',
              data: base64Pcm16k,
            },
          },
        })
      );
    } catch (err) {
      console.error('[audio] Twilio→Gemini conversion error:', err.message);
    }
  }

  _flushAudioQueue() {
    if (this.audioQueue.length === 0) return;
    console.log(`[audio] Flushing ${this.audioQueue.length} queued audio chunks to Gemini`);
    for (const chunk of this.audioQueue) {
      this._forwardTwilioAudioToGemini(chunk);
    }
    this.audioQueue = [];
  }

  // ------- Call‑end bookkeeping -------

  async _onCallEnd() {
    const durationSeconds = Math.round((Date.now() - this.startTime) / 1000);
    console.log(`[session] Call ended – duration=${durationSeconds}s transcriptLines=${this.transcript.length}`);

    // Build a simple text summary from transcript
    const summaryText = this.transcript.length > 0
      ? this.transcript.map(t => `${t.role}: ${t.text}`).join(' | ').slice(0, 500)
      : 'No transcript captured.';

    // Update the outbound_calls record in Supabase
    if (this.callId) {
      try {
        await supabaseRequest('PATCH', 'outbound_calls', {
          query: `id=eq.${this.callId}`,
          body: {
            status: 'completed',
            duration: durationSeconds,
            transcript: this.transcript,
            summary: summaryText,
          },
        });
        console.log(`[session] Updated outbound_calls record id=${this.callId}`);
      } catch (err) {
        console.error('[session] Failed to update outbound_calls:', err.message);
      }
    }

    this.cleanup();
  }

  // ------- Cleanup -------

  cleanup() {
    if (this.geminiWs) {
      try {
        this.geminiWs.close();
      } catch { /* ignore */ }
      this.geminiWs = null;
    }

    if (this.twilioWs) {
      try {
        this.twilioWs.close();
      } catch { /* ignore */ }
      this.twilioWs = null;
    }

    this.geminiReady = false;
    this.audioQueue = [];
  }
}

// ---------------------------------------------------------------------------
// 6. HTTP + WebSocket server
// ---------------------------------------------------------------------------

const PORT = process.env.PORT || process.env.TWILIO_BRIDGE_PORT || 3001;

const httpServer = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Health check endpoint
  if (urlObj.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }

  // TwiML webhook (GET or POST)
  if (urlObj.pathname === '/api/calls/twiml') {
    const agentId = urlObj.searchParams.get('agentId') || '';
    const callId = urlObj.searchParams.get('callId') || '';
    const businessId = urlObj.searchParams.get('businessId') || '';
    const wsHost = req.headers.host || 'localhost:3001';

    console.log(`[webhook] Generating TwiML for agent=${agentId} call=${callId} host=${wsHost}`);

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="hi-IN">कृपया कॉल कनेक्ट होने तक प्रतीक्षा करें।</Say>
  <Say voice="alice" language="te-IN">దయచేసి వేచి ఉండండి, మీ కాల్ కనెక్ట్ అవుతోంది.</Say>
  <Say voice="alice" language="en-IN">Please hold while we connect your call.</Say>
  <Connect>
    <Stream url="wss://${wsHost}/media-stream">
      <Parameter name="agentId" value="${agentId}" />
      <Parameter name="callId" value="${callId}" />
      <Parameter name="businessId" value="${businessId}" />
    </Stream>
  </Connect>
</Response>`;

    res.writeHead(200, { 'Content-Type': 'text/xml; charset=utf-8' });
    res.end(twiml);
    return;
  }

  // Status callback webhook (POST)
  if (urlObj.pathname === '/api/calls/status' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const params = new URLSearchParams(body);
        const callSid = params.get('CallSid');
        const callStatus = params.get('CallStatus');
        const callDuration = params.get('CallDuration');
        const recordingUrl = params.get('RecordingUrl');

        if (recordingUrl && callSid) {
          console.log(`[webhook] Received RecordingUrl for ${callSid}`);
          await supabaseRequest('PATCH', 'outbound_calls', {
            query: `twilio_call_sid=eq.${callSid}`,
            body: { recording_url: recordingUrl },
          });
        }

        if (callSid && callStatus) {
          console.log(`[webhook] CallStatus changed for ${callSid}: ${callStatus}`);
          
          const statusMap = {
            'queued': 'initiated',
            'initiated': 'initiated',
            'ringing': 'ringing',
            'in-progress': 'in_progress',
            'completed': 'completed',
            'failed': 'failed',
            'no-answer': 'no_answer',
            'busy': 'busy',
            'canceled': 'failed',
          };
          const mappedStatus = statusMap[callStatus] || 'failed';

          const updateData = { status: mappedStatus };
          if (callDuration) updateData.duration = parseInt(callDuration, 10);
          if (recordingUrl) updateData.recording_url = recordingUrl;

          // Update outbound_calls in Supabase
          const calls = await supabaseRequest('PATCH', 'outbound_calls', {
            query: `twilio_call_sid=eq.${callSid}`,
            body: updateData,
          });

          const callRecord = calls?.[0];
          if (callRecord && callRecord.lead_id) {
            if (mappedStatus === 'completed') {
              await supabaseRequest('PATCH', 'leads', {
                query: `id=eq.${callRecord.lead_id}`,
                body: {
                  status: 'called',
                  last_called_at: new Date().toISOString(),
                },
              });
              console.log(`[webhook] Updated lead status to called for lead=${callRecord.lead_id}`);
            } else if (['no_answer', 'busy', 'failed'].includes(mappedStatus)) {
              await supabaseRequest('PATCH', 'leads', {
                query: `id=eq.${callRecord.lead_id}`,
                body: {
                  last_called_at: new Date().toISOString(),
                },
              });
              console.log(`[webhook] Updated lead last_called_at for lead=${callRecord.lead_id}`);
            }
          }
        }
      } catch (err) {
        console.error('[webhook] Error handling status callback:', err.message);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true }));
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const wss = new WebSocket.Server({ server: httpServer, path: '/media-stream' });

wss.on('connection', (ws, req) => {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('[server] New Twilio Media Stream connection');
  console.log(`[server] Origin: ${req.headers.origin || 'n/a'}  Remote: ${req.socket.remoteAddress}`);
  console.log('═══════════════════════════════════════════════════════');

  // Create a session – agentId/callId/businessId will be populated on the 'start' event
  const session = new CallSession(ws, {});

  ws.on('message', (data) => {
    session.onTwilioMessage(data.toString());
  });

  ws.on('close', (code, reason) => {
    console.log(`[server] Twilio WebSocket closed (code=${code})`);
    session._onCallEnd().catch(() => {});
  });

  ws.on('error', (err) => {
    console.error('[server] Twilio WebSocket error:', err.message);
    session.cleanup();
  });
});

wss.on('error', (err) => {
  console.error('[server] WebSocket server error:', err.message);
});

httpServer.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log(`║  Twilio ↔ Gemini Bridge Server                       ║`);
  console.log(`║  WebSocket: ws://localhost:${PORT}/media-stream          ║`);
  console.log(`║  Health:    http://localhost:${PORT}/health               ║`);
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');
  console.log('[server] Waiting for Twilio Media Stream connections …');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[server] Shutting down …');
  wss.clients.forEach((client) => client.close());
  httpServer.close(() => {
    console.log('[server] Goodbye.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n[server] SIGTERM received, shutting down …');
  wss.clients.forEach((client) => client.close());
  httpServer.close(() => process.exit(0));
});
