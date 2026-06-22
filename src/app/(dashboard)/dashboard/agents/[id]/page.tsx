'use client'
import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useBusinessStore } from '@/store/business'
import { agentsService } from '@/services/agents'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Toast } from '@/components/ui/Toast'
import Link from 'next/link'

const voiceOptions = [
  { value: 'Aoede', label: 'Aoede (Soft & Friendly)' },
  { value: 'Puck', label: 'Puck (Cheerful & High-pitched)' },
  { value: 'Charon', label: 'Charon (Deep & Professional)' },
  { value: 'Kore', label: 'Kore (Clear & Calm)' },
  { value: 'Fenrir', label: 'Fenrir (Energetic)' }
]

export default function AgentDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { agents, updateAgent } = useBusinessStore()
  
  const agent = agents.find((a) => a.id === id)
  
  const [name, setName] = useState('')
  const [voice, setVoice] = useState('Aoede')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [tonality, setTonality] = useState<'friendly' | 'professional' | 'energetic'>('friendly')
  
  const [loading, setLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    if (agent) {
      setName(agent.name)
      setVoice(agent.voice)
      setSystemPrompt(agent.system_prompt)
      setTonality(agent.tonality)
    }
  }, [agent])

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500 italic">Agent not found or loading...</p>
        <Link href="/dashboard/agents" className="mt-4 inline-block">
          <Button variant="outline">Back to Agents</Button>
        </Link>
      </div>
    )
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const updated = await agentsService.updateAgent(agent.id, {
        name,
        voice: voice as any,
        system_prompt: systemPrompt,
        tonality
      })

      if (updated) {
        updateAgent(updated)
        setToastMessage('Agent updated successfully!')
        setToastType('success')
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Error updating agent')
      setToastType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center space-x-3">
        <Link href="/dashboard/agents">
          <Button variant="ghost" size="sm" className="p-1">
            ← Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Configure {agent.name}</h1>
          <p className="text-sm text-slate-500">Fine-tune behavior instructions and voice characteristics.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              label="Agent Name"
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

            <Textarea
              label="System Instructions Prompt"
              rows={8}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              required
            />

            <div className="flex space-x-3 pt-4">
              <Button type="submit" className="flex-1" isLoading={loading}>
                Save Changes
              </Button>
              <Link href="/dashboard/agents" className="flex-1">
                <Button variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}
    </div>
  )
}
