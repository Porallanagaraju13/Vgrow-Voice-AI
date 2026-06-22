'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useBusinessStore } from '@/store/business'
import { agentsService } from '@/services/agents'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Toast } from '@/components/ui/Toast'
import VoiceWidget from '@/components/voice/VoiceWidget'

const voiceOptions = [
  { value: 'Aoede', label: 'Aoede (Soft & Friendly)' },
  { value: 'Puck', label: 'Puck (Cheerful & High-pitched)' },
  { value: 'Charon', label: 'Charon (Deep & Professional)' },
  { value: 'Kore', label: 'Kore (Clear & Calm)' },
  { value: 'Fenrir', label: 'Fenrir (Energetic)' }
]

const presetPrompts = {
  receptionist: "You are a professional receptionist. Your main task is to greet customers politely, answer questions about our business, describe services offered, and help callers schedule appointments. Always remain courteous and prompt.",
  booking: "You are an appointment booking coordinator. Focus on asking the caller for their name, phone number, preferred service, and selecting an available date and time slot. Call book_appointment once you confirm details.",
  support: "You are a customer support agent. Answer customer queries based on the business FAQs. Help troubleshoot problems, list pricing, and write detailed customer notes if they ask to schedule a follow-up."
}

export default function AgentsPage() {
  const { agents, addAgent, updateAgent, deleteAgent, business } = useBusinessStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  // Form states
  const [name, setName] = useState('')
  const [voice, setVoice] = useState('Aoede')
  const [systemPrompt, setSystemPrompt] = useState(presetPrompts.receptionist)
  const [tonality, setTonality] = useState<'friendly' | 'professional' | 'energetic'>('friendly')
  const [loading, setLoading] = useState(false)

  // Active testing agent
  const [testAgentId, setTestAgentId] = useState<string | null>(null)

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const created = await agentsService.createAgent({
        name,
        voice: voice as any,
        system_prompt: systemPrompt,
        tonality,
        is_active: true
      })

      if (created) {
        addAgent(created)
        setName('')
        setVoice('Aoede')
        setSystemPrompt(presetPrompts.receptionist)
        setTonality('friendly')
        setIsModalOpen(false)
        setToastMessage('Agent created successfully!')
        setToastType('success')
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Error creating agent')
      setToastType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const updated = await agentsService.updateAgent(id, { is_active: !active })
      if (updated) {
        updateAgent(updated)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return
    const success = await agentsService.deleteAgent(id)
    if (success) {
      deleteAgent(id)
      setToastMessage('Agent deleted')
      setToastType('success')
      if (testAgentId === id) setTestAgentId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">AI Voice Agents</h1>
          <p className="text-sm text-slate-500">Configure and sand-test receptionists for your business.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Create Agent</Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents.length === 0 ? (
          <div className="col-span-full py-12">
            <Card className="text-center p-8 border-dashed border-slate-200">
              <p className="text-sm text-slate-500 italic">No agents configured. Click "Create Agent" to get started.</p>
            </Card>
          </div>
        ) : (
          agents.map((agent) => (
            <Card key={agent.id} className="flex flex-col justify-between hover:shadow-md transition">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant={agent.is_active ? 'success' : 'secondary'} className="mb-2">
                    {agent.is_active ? 'Active' : 'Disabled'}
                  </Badge>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto min-h-0 text-slate-400 hover:text-slate-600"
                      onClick={() => handleToggleActive(agent.id, agent.is_active)}
                    >
                      {agent.is_active ? 'Disable' : 'Enable'}
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg font-bold text-slate-900">{agent.name}</CardTitle>
                <CardDescription className="capitalize">
                  Voice: {agent.voice} | Tone: {agent.tonality}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-3 text-sm text-slate-600 line-clamp-3">
                {agent.system_prompt}
              </CardContent>
              <div className="p-6 pt-0 flex space-x-2 border-t border-slate-100 mt-4">
                <Link href={`/dashboard/agents/${agent.id}`} className="flex-1">
                  <Button variant="outline" className="w-full text-xs" size="sm">
                    Configure Prompt
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  className="text-xs flex-1"
                  size="sm"
                  onClick={() => setTestAgentId(agent.id)}
                >
                  Test Sandbox
                </Button>
                <Button
                  variant="ghost"
                  className="text-red-500 hover:bg-red-50 text-xs p-2 h-auto"
                  size="sm"
                  onClick={() => handleDelete(agent.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Floating Testing Voice Widget */}
      {testAgentId && (
        <div className="fixed bottom-24 right-6 max-w-sm z-40 shadow-2xl">
          <VoiceWidget agentId={testAgentId} geminiApiKey={business?.gemini_api_key} />
        </div>
      )}

      {/* Create Agent Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create AI Agent">
        <form onSubmit={handleCreateAgent} className="space-y-4">
          <Input
            label="Agent Name"
            placeholder="e.g. Sarah (Receptionist)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Select
            label="Voice Model"
            options={voiceOptions}
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            required
          />

          <Select
            label="Tonality / Mood"
            options={[
              { value: 'friendly', label: 'Friendly & Polite' },
              { value: 'professional', label: 'Professional & Business' },
              { value: 'energetic', label: 'Energetic & Enthusiastic' }
            ]}
            value={tonality}
            onChange={(e) => setTonality(e.target.value as 'friendly' | 'professional' | 'energetic')}
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500">Preset Prompts</label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setSystemPrompt(presetPrompts.receptionist)}
              >
                Receptionist
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setSystemPrompt(presetPrompts.booking)}
              >
                Booking
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setSystemPrompt(presetPrompts.support)}
              >
                Customer Support
              </Button>
            </div>
          </div>

          <Textarea
            label="System Instructions Prompt"
            rows={4}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            required
          />

          <Button type="submit" className="w-full" isLoading={loading}>
            Create and Deploy Agent
          </Button>
        </form>
      </Modal>

      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}
    </div>
  )
}
