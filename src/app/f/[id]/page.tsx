'use client'
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { formsService } from '@/services/forms'
import { CampaignForm } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

export default function PublicCampaignForm() {
  const params = useParams()
  const formId = params.id as string

  const [form, setForm] = useState<CampaignForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    if (formId) loadForm()
  }, [formId])

  const loadForm = async () => {
    try {
      const data = await formsService.getForm(formId)
      if (!data) throw new Error('Form not found')
      setForm(data)
    } catch (err) {
      setError('This form is invalid or no longer active.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/campaign/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: form.business_id,
          name,
          phone,
          notes: `Captured via Native Form: ${form.title}`
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit form.')
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error && !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full text-center py-12">
          <CardContent>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Form Unavailable</h2>
            <p className="text-slate-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!form) return null

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" style={{ backgroundColor: `${form.brand_color}0A` }}>
        <Card className="max-w-md w-full text-center py-16 overflow-hidden relative shadow-2xl border-0">
          <div className="absolute top-0 inset-x-0 h-2" style={{ backgroundColor: form.brand_color }}></div>
          <CardContent>
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: `${form.brand_color}1A`, color: form.brand_color }}>
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Success!</h2>
            <p className="text-slate-600 text-lg">Thank you. Expect a call momentarily.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-8" style={{ backgroundColor: `${form.brand_color}08` }}>
      <div className="max-w-md w-full">
        <Card className="overflow-hidden shadow-2xl border-0">
          {/* Header Accent */}
          <div className="h-3 w-full" style={{ backgroundColor: form.brand_color }}></div>
          
          <div className="px-8 py-10">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight mb-3">
                {form.title}
              </h1>
              {form.description && (
                <p className="text-slate-600 text-base leading-relaxed">
                  {form.description}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full h-14 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 focus:outline-none focus:ring-2 transition-shadow placeholder:text-slate-400"
                  style={{ '--tw-ring-color': `${form.brand_color}40` } as any}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full h-14 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 focus:outline-none focus:ring-2 transition-shadow placeholder:text-slate-400"
                  style={{ '--tw-ring-color': `${form.brand_color}40` } as any}
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 font-medium">
                  {error}
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-14 rounded-xl text-white font-bold text-lg transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
                  style={{ backgroundColor: form.brand_color, boxShadow: `0 8px 24px -8px ${form.brand_color}` }}
                >
                  {submitting ? (
                    <div className="h-6 w-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    form.button_text || 'Submit'
                  )}
                </button>
              </div>
            </form>
          </div>
        </Card>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest flex items-center justify-center gap-1.5">
            Powered by <span className="text-slate-600 font-black normal-case">VgrowVoice</span>
          </p>
        </div>
      </div>
    </div>
  )
}
