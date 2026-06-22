'use client'
import React, { useState } from 'react'
import { useBusinessStore } from '@/store/business'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'

export default function WidgetPage() {
  const { agents } = useBusinessStore()
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [copied, setCopied] = useState(false)

  // Initialize selected agent
  React.useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id)
    }
  }, [agents, selectedAgentId])

  const agentOptions = agents.map(a => ({ value: a.id, label: a.name }))

  // Generate widget script tags
  const embedCode = `<!-- VgrowVoice AI floating widget embed -->
<script
  src="${typeof window !== 'undefined' ? window.location.origin : ''}/api/widget-script"
  data-agent-id="${selectedAgentId || 'your-agent-id'}"
  defer
></script>`

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Website Embed Widget</h1>
        <p className="text-sm text-slate-500">Generate a custom script tag to embed your voice assistant directly into any website.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configure Integration</CardTitle>
          <CardDescription>Select which AI agent should represent the embedded receptionist widget.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {agents.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-400 italic">
              Please create an agent first to generate your widget embed code.
            </div>
          ) : (
            <>
              <Select
                label="Active Voice Agent"
                options={agentOptions}
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
              />

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Embed HTML Script</label>
                <div className="relative">
                  <pre className="bg-slate-50 text-slate-600 border border-slate-200 text-xs rounded-lg p-4 font-mono overflow-x-auto select-all leading-relaxed">
                    {embedCode}
                  </pre>
                  <Button
                    size="sm"
                    className="absolute top-2 right-2 text-xs"
                    onClick={handleCopy}
                  >
                    {copied ? 'Copied!' : 'Copy Code'}
                  </Button>
                </div>
                <p className="text-xs text-slate-400">Copy and paste this script tag inside the body tag of your website.</p>
              </div>

              {/* Steps */}
              <div className="border-t border-slate-150 pt-6 space-y-4">
                <h4 className="text-sm font-bold text-slate-800">How to integrate:</h4>
                <ol className="list-decimal list-inside text-xs text-slate-600 space-y-2.5 leading-relaxed">
                  <li>Select the active voice agent from the dropdown above.</li>
                  <li>Copy the generated HTML script tag.</li>
                  <li>Paste it into your website files (e.g. WordPress, Webflow, Shopify, or HTML index files).</li>
                  <li>The floating microphone widget will automatically appear in the bottom-right corner of your site.</li>
                </ol>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {copied && (
        <Toast message="Embed code copied to clipboard!" onClose={() => setCopied(false)} />
      )}
    </div>
  )
}
