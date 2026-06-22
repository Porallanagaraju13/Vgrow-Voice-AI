'use client'
import React, { useState } from 'react'
import { useBusinessStore } from '@/store/business'
import { servicesService } from '@/services/services'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Toast } from '@/components/ui/Toast'

export default function ServicesPage() {
  const { services, addService, updateService, deleteService } = useBusinessStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState(0)
  const [duration, setDuration] = useState(30)
  
  const [loading, setLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const handleOpenCreate = () => {
    setEditingId(null)
    setName('')
    setDescription('')
    setPrice(0)
    setDuration(30)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (svc: any) => {
    setEditingId(svc.id)
    setName(svc.name)
    setDescription(svc.description || '')
    setPrice(Number(svc.price))
    setDuration(Number(svc.duration))
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingId) {
        const updated = await servicesService.updateService(editingId, { name, description, price, duration })
        if (updated) {
          updateService(updated)
          setToastMessage('Service updated!')
          setToastType('success')
        }
      } else {
        const created = await servicesService.createService({ name, description, price, duration })
        if (created) {
          addService(created)
          setToastMessage('Service added!')
          setToastType('success')
        }
      }
      setIsModalOpen(false)
    } catch (err: any) {
      setToastMessage(err.message || 'Error saving service')
      setToastType('error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return
    const success = await servicesService.deleteService(id)
    if (success) {
      deleteService(id)
      setToastMessage('Service deleted')
      setToastType('success')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Offered Services</h1>
          <p className="text-sm text-slate-500">Configure appointment types for your voice scheduling agent.</p>
        </div>
        <Button onClick={handleOpenCreate}>Add Service</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {services.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400 italic">
              No services added yet. Add items like "Dent Repair" or "Routine Diagnostics".
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((svc) => (
                  <TableRow key={svc.id}>
                    <TableCell className="font-semibold text-slate-800">{svc.name}</TableCell>
                    <TableCell className="text-slate-600 text-xs max-w-xs">{svc.description || 'N/A'}</TableCell>
                    <TableCell>{svc.duration} minutes</TableCell>
                    <TableCell className="font-bold text-orange-600">${Number(svc.price).toFixed(2)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs px-2.5 py-1 min-h-0"
                        onClick={() => handleOpenEdit(svc)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-50 text-xs px-2.5 py-1 min-h-0"
                        onClick={() => handleDelete(svc.id)}
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
        title={editingId ? 'Edit Service' : 'Add Service'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Service Name"
            placeholder="e.g. Standard Oil Change"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Textarea
            label="Description"
            placeholder="e.g. Includes full oil swap, filter replacement, fluid top-up, and generic diagnostics."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (Minutes)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              required
            />
            <Input
              label="Price ($)"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
            />
          </div>

          <Button type="submit" className="w-full" isLoading={loading}>
            Save Service
          </Button>
        </form>
      </Modal>

      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}
    </div>
  )
}
