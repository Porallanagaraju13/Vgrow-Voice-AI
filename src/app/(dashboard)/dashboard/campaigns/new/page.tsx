'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formsService } from '@/services/forms'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Toast } from '@/components/ui/Toast'
import { ArrowLeft } from 'lucide-react'

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('Get a Free Callback')
  const [description, setDescription] = useState('Enter your details below and our AI Assistant will call you immediately.')
  const [buttonText, setButtonText] = useState('Call Me Now')
  const [brandColor, setBrandColor] = useState('#F16232')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await formsService.createForm({
        title,
        description,
        button_text: buttonText,
        brand_color: brandColor,
        status: 'active'
      })
      router.push('/dashboard/campaigns')
    } catch (err: any) {
      setError(err.message || 'Failed to create form')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/campaigns')} className="px-3">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Create Campaign Form</h1>
          <p className="text-sm text-slate-500">Design your hosted lead capture form.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Form Details</CardTitle>
            <CardDescription>What should your form say?</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Form Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Claim Your Free Offer"
                required
              />
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                  Description (Optional)
                </label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-[15px] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none h-24 placeholder:text-slate-400"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what the customer is signing up for..."
                />
              </div>

              <Input
                label="Button Text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="e.g. Submit"
                required
              />

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                  Brand Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="h-10 w-14 rounded cursor-pointer border border-slate-200"
                  />
                  <Input 
                    value={brandColor} 
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="font-mono uppercase"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full" isLoading={loading}>
                  Create Form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <div>
          <div className="sticky top-6">
            <h3 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Live Preview</h3>
            <div className="border-[8px] border-slate-800 rounded-[2.5rem] overflow-hidden bg-slate-50 h-[600px] shadow-2xl relative">
              {/* Phone Notch */}
              <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-xl w-32 mx-auto z-10"></div>
              
              <div className="h-full w-full flex flex-col p-6 overflow-y-auto">
                <div className="mt-8 space-y-6">
                  <div className="text-center">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title || 'Form Title'}</h1>
                    {description && (
                      <p className="mt-2 text-slate-500 text-sm leading-relaxed">{description}</p>
                    )}
                  </div>
                  
                  <div className="space-y-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Full Name</label>
                      <div className="h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 flex items-center text-slate-400 text-sm">John Doe</div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Phone Number</label>
                      <div className="h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 flex items-center text-slate-400 text-sm">+1 (555) 000-0000</div>
                    </div>
                    <button 
                      className="w-full h-12 rounded-xl text-white font-bold transition-transform shadow-lg mt-2"
                      style={{ backgroundColor: brandColor, boxShadow: `0 4px 14px 0 ${brandColor}40` }}
                    >
                      {buttonText || 'Submit'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && <Toast message={error} type="error" onClose={() => setError('')} />}
    </div>
  )
}
