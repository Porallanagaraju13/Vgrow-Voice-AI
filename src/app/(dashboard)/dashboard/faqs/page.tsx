'use client'
import React, { useState } from 'react'
import { useBusinessStore } from '@/store/business'
import { faqsService } from '@/services/faqs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Toast } from '@/components/ui/Toast'

export default function FAQsPage() {
  const { faqs, addFaq, updateFaq, deleteFaq } = useBusinessStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null)
  
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const handleOpenCreate = () => {
    setEditingFaqId(null)
    setQuestion('')
    setAnswer('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (faq: any) => {
    setEditingFaqId(faq.id)
    setQuestion(faq.question)
    setAnswer(faq.answer)
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingFaqId) {
        const updated = await faqsService.updateFaq(editingFaqId, { question, answer })
        if (updated) {
          updateFaq(updated)
          setToastMessage('FAQ updated!')
          setToastType('success')
        }
      } else {
        const created = await faqsService.createFaq({ question, answer })
        if (created) {
          addFaq(created)
          setToastMessage('FAQ added!')
          setToastType('success')
        }
      }
      setIsModalOpen(false)
    } catch (err: any) {
      setToastMessage(err.message || 'Error saving FAQ')
      setToastType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return
    const success = await faqsService.deleteFaq(id)
    if (success) {
      deleteFaq(id)
      setToastMessage('FAQ deleted')
      setToastType('success')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">FAQs Knowledge Base</h1>
          <p className="text-sm text-slate-500">Add questions and answers so your agent can answer inquiries correctly.</p>
        </div>
        <Button onClick={handleOpenCreate}>Add FAQ</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {faqs.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400 italic">
              No FAQs added yet. Add some questions about your pricing, location, hours, or services.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">Question</TableHead>
                  <TableHead className="w-1/2">Answer</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell className="font-semibold text-slate-800">
                      {faq.question}
                    </TableCell>
                    <TableCell className="text-slate-600 max-w-sm break-words">
                      {faq.answer}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs px-2.5 py-1 min-h-0"
                        onClick={() => handleOpenEdit(faq)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-50 text-xs px-2.5 py-1 min-h-0"
                        onClick={() => handleDelete(faq.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFaqId ? 'Edit FAQ' : 'Add FAQ'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Question"
            placeholder="e.g. What are your opening hours?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
          />

          <Textarea
            label="Answer Details"
            placeholder="e.g. We are open Monday to Friday from 9 AM to 6 PM, and Saturdays from 10 AM to 4 PM."
            rows={5}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
          />

          <Button type="submit" className="w-full" isLoading={loading}>
            Save FAQ Entry
          </Button>
        </form>
      </Modal>

      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}
    </div>
  )
}
