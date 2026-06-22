'use client'
import React, { useState } from 'react'
import { useBusinessStore } from '@/store/business'
import { businessService } from '@/services/business'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Toast } from '@/components/ui/Toast'

export default function SettingsPage() {
  const { business, setBusiness } = useBusinessStore()
  
  const [name, setName] = useState(business?.name || '')
  const [phone, setPhone] = useState(business?.phone || '')
  const [geminiApiKey, setGeminiApiKey] = useState(business?.gemini_api_key || '')
  
  const [loading, setLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const updated = await businessService.updateProfile({
        name,
        phone,
        gemini_api_key: geminiApiKey || undefined
      })

      if (updated) {
        setBusiness(updated)
        setToastMessage('Settings updated successfully!')
        setToastType('success')
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Error updating settings')
      setToastType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500">Configure business information and Gemini API credentials.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
          <CardDescription>Update your general contact details and Google Cloud credentials.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateSettings} className="space-y-4">
            <Input
              label="Business Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            
            <Input
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <div className="space-y-1">
              <Input
                label="Gemini API Key Override"
                type="password"
                placeholder="AIzaSy..."
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
              />
              <p className="text-3xs text-slate-500 leading-normal pl-0.5">
                Leave blank to fallback to system default. This key is stored securely in your private database profile.
              </p>
            </div>

            <Button type="submit" className="w-full mt-4" isLoading={loading}>
              Save Profile Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}

      {business && (
        <Card className="mt-8 border-brand-200">
          <CardHeader className="bg-brand-50/50">
            <CardTitle className="text-brand-900">API & Integrations</CardTitle>
            <CardDescription>
              Use this Webhook URL to connect your Voice Agent directly to Meta (Facebook/Instagram) Lead Ads, Google Ads, or Zapier.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Webhook URL (POST)</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-slate-100 p-3 rounded-lg text-sm text-slate-800 break-all border border-slate-200">
                  {typeof window !== 'undefined' ? `${window.location.origin}/api/campaign/submit` : '/api/campaign/submit'}
                </code>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/api/campaign/submit`);
                    setToastMessage('Webhook URL copied!');
                    setToastType('success');
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Required JSON Payload</label>
              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs overflow-x-auto border border-slate-800 shadow-inner">
{`{
  "business_id": "${business.id}",
  "name": "John Doe",
  "phone": "+1234567890"
}`}
              </pre>
              <p className="text-xs text-slate-500 mt-2">
                Configure your Meta/Google ad form to send the lead's name and phone number in this exact format. 
                Your <b>business_id</b> is hardcoded above to ensure the lead is routed to your specific AI Agent.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
