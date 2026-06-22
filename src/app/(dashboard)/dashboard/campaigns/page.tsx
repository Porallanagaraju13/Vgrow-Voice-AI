'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { formsService } from '@/services/forms'
import { CampaignForm } from '@/types'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Plus, Megaphone, Link as LinkIcon, ExternalLink, Trash2 } from 'lucide-react'
import { Toast } from '@/components/ui/Toast'

export default function CampaignsPage() {
  const [forms, setForms] = useState<CampaignForm[]>([])
  const [loading, setLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    loadForms()
  }, [])

  const loadForms = async () => {
    try {
      const data = await formsService.getForms()
      setForms(data)
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return
    try {
      await formsService.deleteForm(id)
      setToastMessage('Form deleted successfully')
      setToastType('success')
      setForms(forms.filter(f => f.id !== id))
    } catch (err: any) {
      setToastMessage(err.message)
      setToastType('error')
    }
  }

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/f/${id}`
    navigator.clipboard.writeText(url)
    setToastMessage('Public Form URL copied to clipboard!')
    setToastType('success')
  }

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading campaigns...</div>

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Campaign Forms
          </h1>
          <p className="text-sm text-slate-500">Create beautiful, hosted lead capture forms for your ads.</p>
        </div>
        <Link href="/dashboard/campaigns/new">
          <Button className="w-full sm:w-auto flex items-center gap-2 shadow-md">
            <Plus className="h-4 w-4" />
            Create New Form
          </Button>
        </Link>
      </div>

      {forms.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <CardContent>
            <div className="bg-brand-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Megaphone className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">No Campaign Forms Yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Create a hosted lead capture form to share on Facebook Ads, Google Ads, or your website.
            </p>
            <Link href="/dashboard/campaigns/new">
              <Button>Create Your First Form</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map(form => (
            <Card key={form.id} className="flex flex-col border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="h-2 w-full rounded-t-xl" style={{ backgroundColor: form.brand_color }}></div>
              <CardHeader className="flex-1 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{form.title}</CardTitle>
                    {form.description && (
                      <CardDescription className="mt-1 line-clamp-2">{form.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="bg-slate-50/50 border-t border-slate-100 flex items-center gap-2 p-4">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="flex-1 flex items-center gap-1.5"
                  onClick={() => copyLink(form.id)}
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  Copy Link
                </Button>
                <Link href={`/f/${form.id}`} target="_blank">
                  <Button variant="outline" size="sm" className="px-3" title="View Live Form">
                    <ExternalLink className="h-4 w-4 text-slate-600" />
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="px-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-slate-200"
                  onClick={() => handleDelete(form.id)}
                  title="Delete Form"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}
    </div>
  )
}
