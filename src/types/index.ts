export interface Business {
  id: string
  name: string
  industry: 'auto_repair' | 'healthcare' | 'restaurant' | 'custom'
  email?: string
  phone?: string
  gemini_api_key?: string
  created_at: string
}

export interface Agent {
  id: string
  business_id: string
  name: string
  voice: 'Aoede' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir'
  system_prompt: string
  tonality: 'friendly' | 'professional' | 'energetic'
  is_active: boolean
  created_at: string
}

export interface FAQ {
  id: string
  business_id: string
  question: string
  answer: string
  created_at: string
}

export interface Service {
  id: string
  business_id: string
  name: string
  description?: string
  price: number
  duration: number // in minutes
  created_at: string
}

export interface Appointment {
  id: string
  business_id: string
  customer_name: string
  customer_phone: string
  service_id?: string
  start_time: string
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  service?: Service
}

export interface Message {
  role: 'user' | 'model'
  text: string
  timestamp?: string
}

export interface Conversation {
  id: string
  business_id: string
  agent_id?: string
  customer_name?: string
  customer_phone?: string
  transcript: Message[]
  summary?: string
  status: 'active' | 'completed'
  duration: number // in seconds
  created_at: string
  agent?: Agent
}

export interface Lead {
  id: string
  business_id: string
  name: string
  phone: string
  company?: string
  notes?: string
  status: 'new' | 'called' | 'converted' | 'lost'
  last_called_at?: string
  created_at: string
}

export interface OutboundCall {
  id: string
  business_id: string
  agent_id: string
  lead_id: string
  twilio_call_sid?: string
  status: 'initiated' | 'ringing' | 'in_progress' | 'completed' | 'failed' | 'no_answer' | 'busy'
  duration?: number
  recording_url?: string
  transcript?: Message[]
  summary?: string
  from_number: string
  to_number: string
  created_at: string
  lead?: Lead
  agent?: Agent
}

export interface CampaignForm {
  id: string
  business_id: string
  title: string
  description?: string
  brand_color: string
  button_text: string
  status: 'active' | 'inactive'
  created_at: string
}