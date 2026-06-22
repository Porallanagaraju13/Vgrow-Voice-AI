import { useRef, useState, useEffect, useCallback } from 'react'
import { useVoiceStore } from '@/store/voice'
import { widgetsService } from '@/services/widgets'
import { conversationsService } from '@/services/conversations'
import { Message } from '@/types'

// Helper: base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

// Helper: float array to base64 16kHz PCM
function floatTo16BitPCMBase64(input: Float32Array): string {
  const buffer = new ArrayBuffer(input.length * 2)
  const view = new DataView(buffer)
  for (let i = 0; i < input.length; i++) {
    let s = Math.max(-1, Math.min(1, input[i]))
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
  }
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

export function useRealtimeVoice(agentId: string, geminiApiKey?: string) {
  const {
    isConnected,
    isConnecting,
    messages,
    setIsConnected,
    setIsConnecting,
    setIsSpeaking,
    setIsListening,
    addMessage,
    setMessages,
    setWaveData,
    resetCall
  } = useVoiceStore()

  const socketRef = useRef<WebSocket | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null)
  
  // Timing state for seamless audio stitching
  const nextPlayTimeRef = useRef<number>(0)
  const [activeAgentId, setActiveAgentId] = useState<string>(agentId)
  
  const startTimeRef = useRef<number>(0)
  const agentConfigRef = useRef<any>(null)
  const currentUserTextRef = useRef<string>('')
  const currentAgentTextRef = useRef<string>('')

  // Disconnect function
  const disconnect = useCallback(() => {
    // Stop mic
    if (scriptNodeRef.current) {
      scriptNodeRef.current.disconnect()
      scriptNodeRef.current = null
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop())
      micStreamRef.current = null
    }
    // Close audio context
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    // Close socket
    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }

    // Save call to database if there are messages
    const currentMessages = useVoiceStore.getState().messages
    const duration = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0
    const businessId = agentConfigRef.current?.agent.business_id

    if (currentMessages.length > 0 && businessId) {
      conversationsService.createConversation({
        business_id: businessId,
        agent_id: agentId,
        customer_name: 'Web Sandbox User',
        customer_phone: 'N/A',
        transcript: currentMessages,
        summary: currentMessages.filter(m => m.role === 'model').map(m => m.text).join(' | ').slice(0, 500) || 'Sandbox session.',
        status: 'completed',
        duration: duration
      }).catch(err => {
        console.error('Failed to save conversation:', err)
      })
    }

    // Reset timing/configs
    startTimeRef.current = 0

    resetCall()
  }, [agentId, resetCall])

  // Play PCM 24kHz base64 audio chunks
  const playAudioChunk = useCallback((base64Data: string) => {
    if (!audioCtxRef.current) return

    const arrayBuffer = base64ToArrayBuffer(base64Data)
    const int16Array = new Int16Array(arrayBuffer)
    const float32Array = new Float32Array(int16Array.length)

    // Convert 16-bit Int16 back to Float32 (-1.0 to 1.0)
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0
    }

    const audioCtx = audioCtxRef.current
    const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000)
    audioBuffer.getChannelData(0).set(float32Array)

    const source = audioCtx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(audioCtx.destination)

    // Stitch audio segments seamlessly
    const currentTime = audioCtx.currentTime
    const startTime = Math.max(nextPlayTimeRef.current, currentTime)
    source.start(startTime)
    nextPlayTimeRef.current = startTime + audioBuffer.duration

    // Update waveform data from the active buffer (first 20 samples)
    const visualData = Array.from(float32Array.slice(0, 20)).map((v) => Math.abs(v) * 100)
    if (visualData.length > 0) {
      setWaveData(visualData)
    }
  }, [setWaveData])

  // Setup tools inside hook
  const handleToolCall = useCallback(async (toolCall: any) => {
    const { functionCalls } = toolCall
    if (!functionCalls) return

    const functionResponses = []

    for (const call of functionCalls) {
      const { name, id, args } = call
      let output: any = { error: 'Function not found' }

      try {
        if (name === 'get_available_slots') {
          const { date } = args
          // Get config configuration
          const agentConfig = await widgetsService.getAgentConfig(agentId)
          if (agentConfig) {
            const slots = await widgetsService.getAvailableSlots(agentConfig.agent.business_id, date)
            output = { slots }
          } else {
            output = { error: 'Business config not found' }
          }
        } else if (name === 'book_appointment') {
          const { customer_name, customer_phone, service_name, date, time } = args
          const agentConfig = await widgetsService.getAgentConfig(agentId)
          
          if (agentConfig) {
            // Find service id
            const service = agentConfig.services.find(s => s.name.toLowerCase().includes(service_name.toLowerCase()))
            const startTimeStr = `${date}T${time}:00`

            const result = await widgetsService.bookAppointmentFromWidget({
              business_id: agentConfig.agent.business_id,
              customer_name,
              customer_phone,
              service_id: service?.id,
              start_time: new Date(startTimeStr).toISOString(),
              notes: `Booked via Gemini Voice Receptionist (${agentConfig.agent.name})`
            })
            
            output = {
              success: result.success,
              message: result.message,
              booking_id: result.appointment?.id
            }
          } else {
            output = { error: 'Agent profile not loaded' }
          }
        } else if (name === 'get_business_info') {
          const agentConfig = await widgetsService.getAgentConfig(agentId)
          if (agentConfig) {
            output = {
              business_name: agentConfig.businessName,
              services: agentConfig.services.map(s => ({ name: s.name, price: s.price, duration: s.duration })),
              faqs: agentConfig.faqs.map(f => ({ question: f.question, answer: f.answer }))
            }
          } else {
            output = { error: 'Agent configuration not loaded' }
          }
        }
      } catch (err: any) {
        output = { error: err.message || 'Execution error' }
      }

      functionResponses.push({
        name,
        id,
        response: { output }
      })
    }

    // Send response back
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        toolResponse: { functionResponses }
      }))
    }
  }, [agentId])

  // Connect function
  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return
    setIsConnecting(true)
    setMessages([])

    try {
      // 1. Fetch Agent instructions and settings
      const agentConfig = await widgetsService.getAgentConfig(agentId)
      if (!agentConfig) {
        throw new Error('Failed to load agent configuration')
      }
      agentConfigRef.current = agentConfig

      const apiKey = geminiApiKey || agentConfig.geminiApiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY
      if (!apiKey) {
        throw new Error('Gemini API Key is not configured. Please add one in dashboard settings.')
      }

      // 2. Open WebSocket connection
      const socketUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`
      const ws = new WebSocket(socketUrl)
      socketRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setIsConnecting(false)
        nextPlayTimeRef.current = 0
        startTimeRef.current = Date.now()

        // Send Setup message with prompt instructions and custom tools
        const setupMsg = {
          setup: {
            model: 'models/gemini-3.1-flash-live-preview',
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    // Match voice token
                    voiceName: agentConfig.agent.voice || 'Aoede'
                  }
                }
              },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: {
              parts: [{
                text: `${agentConfig.agent.system_prompt}\n\nYour name is ${agentConfig.agent.name}. You are the receptionist for ${agentConfig.businessName}. Tone: ${agentConfig.agent.tonality}.\n\nGREETING RULE: Start with ONLY: "Hi, I'm ${agentConfig.agent.name}. Which language are you comfortable with?" — nothing else. No listing languages. No elaboration.\nOnce they say a language, IMMEDIATELY switch to that language and ask "How can I help you?" — no delay, no confirmation, no repeating their choice.\nSPEED RULE: Keep ALL responses under 2 sentences. Be direct. No filler words. No "Sure!", "Of course!", "Absolutely!" — just answer.\nAlways use the get_business_info tool first to fetch services, pricing, and FAQs. Use book_appointment for reservations.\nIMPORTANT: Always quote prices in Indian Rupees (₹ / INR). Never use dollars. Say "999 rupees", never "$49".\nNATIVE INDIAN SLANG: When speaking Telugu or Hindi, use natural Hinglish/Telugish code-switching. Blend English words naturally. No formal/archaic translations.\nOTHER BUSINESS RULE: If the business identity is unrecognized or the business is 'Other', politely ask the user to provide their Business Name and list their primary services.`
              }]
            },
            tools: [
              {
                functionDeclarations: [
                  {
                    name: 'get_business_info',
                    description: 'Get details about the business including available services, durations, prices, and FAQs.',
                    parameters: { type: 'OBJECT', properties: {} }
                  },
                  {
                    name: 'get_available_slots',
                    description: 'Get a list of available HH:MM booking slots for a given YYYY-MM-DD date.',
                    parameters: {
                      type: 'OBJECT',
                      properties: {
                        date: { type: 'STRING', description: 'The booking date (YYYY-MM-DD).' }
                      },
                      required: ['date']
                    }
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
                        time: { type: 'STRING', description: 'Reservation slot time (HH:MM).' }
                      },
                      required: ['customer_name', 'customer_phone', 'service_name', 'date', 'time']
                    }
                  }
                ]
              }
            ]
          }
        }

        ws.send(JSON.stringify(setupMsg))
      }

      ws.onmessage = async (event) => {
        let msg: any = {}
        try {
          msg = JSON.parse(event.data)
        } catch (e) {
          return
        }

        // Handle Audio Output Chunks
        const part = msg.serverContent?.modelTurn?.parts?.[0]
        if (part?.inlineData?.data) {
          playAudioChunk(part.inlineData.data)
          setIsSpeaking(true)
          setIsListening(false)
        }

        // Capture output transcript (agent's speech → text)
        if (msg.serverContent?.outputTranscription?.text) {
          if (!currentAgentTextRef.current) currentAgentTextRef.current = ''
          currentAgentTextRef.current += msg.serverContent.outputTranscription.text
        }

        // Capture input transcript (user's speech → text)
        if (msg.serverContent?.inputTranscription?.text) {
          if (!currentUserTextRef.current) currentUserTextRef.current = ''
          currentUserTextRef.current += msg.serverContent.inputTranscription.text
        }

        // Fallback: text parts
        const textContent = part?.text
        if (textContent) {
          addMessage({ role: 'model', text: textContent })
        }

        // End of Model Response turn — flush accumulated transcripts
        if (msg.serverContent?.turnComplete) {
          if (currentUserTextRef.current) {
            addMessage({ role: 'user', text: currentUserTextRef.current.trim() })
            currentUserTextRef.current = ''
          }
          if (currentAgentTextRef.current) {
            addMessage({ role: 'model', text: currentAgentTextRef.current.trim() })
            currentAgentTextRef.current = ''
          }
          setIsSpeaking(false)
          setIsListening(true)
        }

        // Handle Tool Calls
        if (msg.toolCall) {
          await handleToolCall(msg.toolCall)
        }
      }

      ws.onerror = (e) => {
        console.error('Gemini WS Connection Error:', e)
        disconnect()
      }

      ws.onclose = () => {
        disconnect()
      }

      // 3. Request user microphone and record
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStreamRef.current = stream

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioCtxRef.current = audioCtx

      const source = audioCtx.createMediaStreamSource(stream)
      // Capture 2048 samples at 1 channel. ScriptProcessor resamples to 16kHz
      const scriptNode = audioCtx.createScriptProcessor(2048, 1, 1)
      scriptNodeRef.current = scriptNode

      // Downsampling factor: from browser context rate to 16kHz
      const sampleRate = audioCtx.sampleRate
      
      scriptNode.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return

        const inputData = e.inputBuffer.getChannelData(0)
        
        // Simple Resampling to 16000Hz
        const ratio = sampleRate / 16000
        const newLength = Math.round(inputData.length / ratio)
        const resampledData = new Float32Array(newLength)
        
        for (let i = 0; i < newLength; i++) {
          resampledData[i] = inputData[Math.round(i * ratio)]
        }

        // Send base64 binary PCM bytes over WebSocket
        const pcmBase64 = floatTo16BitPCMBase64(resampledData)
        ws.send(JSON.stringify({
          realtimeInput: {
            audio: {
              mimeType: 'audio/pcm;rate=16000',
              data: pcmBase64
            }
          }
        }))
      }

      source.connect(scriptNode)
      scriptNode.connect(audioCtx.destination)

    } catch (err: any) {
      console.error('Call initialization failed:', err)
      disconnect()
    }
  }, [agentId, geminiApiKey, isConnected, isConnecting, disconnect, playAudioChunk, handleToolCall, setIsConnected, setIsConnecting, setIsSpeaking, setIsListening, addMessage])

  // Automatically clean up on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    isConnecting,
    messages,
    connect,
    disconnect
  }
}