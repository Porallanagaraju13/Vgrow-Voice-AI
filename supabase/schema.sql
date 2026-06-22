-- Supabase Database Schema for AI Voice Agent SaaS

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Businesses Table
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    industry TEXT NOT NULL DEFAULT 'auto_repair', -- auto_repair, healthcare, restaurant, custom
    email TEXT,
    phone TEXT,
    gemini_api_key TEXT, -- Allow business-specific API key override
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Businesses
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own business profile"
    ON public.businesses FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own business profile"
    ON public.businesses FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own business profile"
    ON public.businesses FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 3. Create Agents Table
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    voice TEXT NOT NULL DEFAULT 'Aoede', -- Aoede, Puck, Charon, Kore, Fenrir
    system_prompt TEXT NOT NULL,
    tonality TEXT NOT NULL DEFAULT 'friendly', -- friendly, professional, energetic
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Agents
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage agents for their business"
    ON public.agents FOR ALL
    USING (auth.uid() = business_id)
    WITH CHECK (auth.uid() = business_id);

CREATE POLICY "Public can view active agents (for widget load)"
    ON public.agents FOR SELECT
    USING (is_active = true);

-- 4. Create FAQs Table
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for FAQs
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage FAQs for their business"
    ON public.faqs FOR ALL
    USING (auth.uid() = business_id)
    WITH CHECK (auth.uid() = business_id);

CREATE POLICY "Public can view FAQs (for widget context)"
    ON public.faqs FOR SELECT
    USING (true);

-- 5. Create Services Table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    duration INTEGER NOT NULL DEFAULT 30, -- duration in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage services for their business"
    ON public.services FOR ALL
    USING (auth.uid() = business_id)
    WITH CHECK (auth.uid() = business_id);

CREATE POLICY "Public can view services (for widget scheduling)"
    ON public.services FOR SELECT
    USING (true);

-- 6. Create Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, completed, cancelled
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage appointments for their business"
    ON public.appointments FOR ALL
    USING (auth.uid() = business_id)
    WITH CHECK (auth.uid() = business_id);

CREATE POLICY "Public can insert appointments (for widget booking)"
    ON public.appointments FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public can view slots"
    ON public.appointments FOR SELECT
    USING (true);

-- 7. Create Conversations Table (Logs)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_phone TEXT,
    transcript JSONB DEFAULT '[]'::jsonb NOT NULL, -- array of {role: user/model, text: message}
    summary TEXT,
    status TEXT NOT NULL DEFAULT 'completed', -- active, completed
    duration INTEGER NOT NULL DEFAULT 0, -- duration in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage conversations for their business"
    ON public.conversations FOR ALL
    USING (auth.uid() = business_id)
    WITH CHECK (auth.uid() = business_id);

CREATE POLICY "Public can create/update active conversation session logs"
    ON public.conversations FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Public can update dynamic logs"
    ON public.conversations FOR UPDATE
    USING (true);

-- 8. Add useful indexes
CREATE INDEX IF NOT EXISTS idx_agents_business ON public.agents(business_id);
CREATE INDEX IF NOT EXISTS idx_faqs_business ON public.faqs(business_id);
CREATE INDEX IF NOT EXISTS idx_services_business ON public.services(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_business ON public.appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_time ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_conversations_business ON public.conversations(business_id);

-- 9. Create Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    company TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'new', -- new, called, interested, not_interested, callback, no_answer
    last_called_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage leads for their business"
    ON public.leads FOR ALL
    USING (auth.uid() = business_id)
    WITH CHECK (auth.uid() = business_id);

-- 10. Create Outbound Calls Table
CREATE TABLE IF NOT EXISTS public.outbound_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    twilio_call_sid TEXT,
    from_number TEXT,
    to_number TEXT,
    duration INTEGER NOT NULL DEFAULT 0,
    recording_url TEXT,
    transcript JSONB DEFAULT '[]'::jsonb NOT NULL,
    summary TEXT,
    sentiment TEXT DEFAULT 'neutral', -- positive, neutral, negative
    status TEXT NOT NULL DEFAULT 'initiated', -- initiated, ringing, in_progress, completed, failed, no_answer, busy
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.outbound_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage outbound calls for their business"
    ON public.outbound_calls FOR ALL
    USING (auth.uid() = business_id)
    WITH CHECK (auth.uid() = business_id);

-- 11. Add indexes for new tables
CREATE INDEX IF NOT EXISTS idx_leads_business ON public.leads(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_outbound_calls_business ON public.outbound_calls(business_id);
CREATE INDEX IF NOT EXISTS idx_outbound_calls_lead ON public.outbound_calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_outbound_calls_status ON public.outbound_calls(status);

-- 12. Create Campaign Forms Table
CREATE TABLE IF NOT EXISTS public.campaign_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    brand_color TEXT DEFAULT '#F16232',
    button_text TEXT DEFAULT 'Submit & Get a Call',
    status TEXT NOT NULL DEFAULT 'active', -- active, inactive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.campaign_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage campaign forms for their business"
    ON public.campaign_forms FOR ALL
    USING (auth.uid() = business_id)
    WITH CHECK (auth.uid() = business_id);

CREATE POLICY "Public can view active campaign forms"
    ON public.campaign_forms FOR SELECT
    USING (status = 'active');

CREATE INDEX IF NOT EXISTS idx_campaign_forms_business ON public.campaign_forms(business_id);
