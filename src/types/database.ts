import { Business, Agent, FAQ, Service, Appointment, Conversation, Lead, OutboundCall } from './index'

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: Business
        Insert: Omit<Business, 'created_at'>
        Update: Partial<Omit<Business, 'id' | 'created_at'>>
      }
      agents: {
        Row: Agent
        Insert: Omit<Agent, 'id' | 'created_at'>
        Update: Partial<Omit<Agent, 'id' | 'business_id' | 'created_at'>>
      }
      faqs: {
        Row: FAQ
        Insert: Omit<FAQ, 'id' | 'created_at'>
        Update: Partial<Omit<FAQ, 'id' | 'business_id' | 'created_at'>>
      }
      services: {
        Row: Service
        Insert: Omit<Service, 'id' | 'created_at'>
        Update: Partial<Omit<Service, 'id' | 'business_id' | 'created_at'>>
      }
      appointments: {
        Row: Appointment
        Insert: Omit<Appointment, 'id' | 'created_at'>
        Update: Partial<Omit<Appointment, 'id' | 'business_id' | 'created_at'>>
      }
      conversations: {
        Row: Conversation
        Insert: Omit<Conversation, 'id' | 'created_at'>
        Update: Partial<Omit<Conversation, 'id' | 'business_id' | 'created_at'>>
      }
      leads: {
        Row: Lead
        Insert: Omit<Lead, 'id' | 'created_at'>
        Update: Partial<Omit<Lead, 'id' | 'business_id' | 'created_at'>>
      }
      outbound_calls: {
        Row: OutboundCall
        Insert: Omit<OutboundCall, 'id' | 'created_at'>
        Update: Partial<Omit<OutboundCall, 'id' | 'business_id' | 'created_at'>>
      }
    }
  }
}