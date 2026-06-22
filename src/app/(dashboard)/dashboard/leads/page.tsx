'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useBusinessStore } from '@/store/business'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Toast } from '@/components/ui/Toast'
import { Users, Plus, Upload, Phone, Trash2, Edit, UserPlus, Star, PhoneOff, Clock } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type LeadStatus = 'new' | 'called' | 'interested' | 'not_interested' | 'callback' | 'no_answer'

interface Lead {
  id: string
  business_id: string
  name: string
  phone: string
  company?: string
  notes?: string
  status: LeadStatus
  last_called_at?: string
  created_at: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
  new:            { label: 'New',            className: 'bg-blue-100 text-blue-800' },
  called:         { label: 'Called',         className: 'bg-amber-100 text-amber-800' },
  interested:     { label: 'Interested',     className: 'bg-green-100 text-green-800' },
  not_interested: { label: 'Not Interested', className: 'bg-red-100 text-red-800' },
  callback:       { label: 'Callback',       className: 'bg-purple-100 text-purple-800' },
  no_answer:      { label: 'No Answer',      className: 'bg-slate-100 text-slate-600' },
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const cfg = statusConfig[status] ?? statusConfig.new
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LeadsPage() {
  const { agents } = useBusinessStore()

  /* ---- Data State ---- */
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  /* ---- Modal State ---- */
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [isCallOpen, setIsCallOpen] = useState(false)
  const [callingLead, setCallingLead] = useState<Lead | null>(null)

  /* ---- Form State ---- */
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  /* ---- Call Modal State ---- */
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [fromNumber, setFromNumber] = useState('')
  const [initiating, setInitiating] = useState(false)

  /* ---- CSV Ref ---- */
  const csvInputRef = useRef<HTMLInputElement>(null)

  /* ---- Toast ---- */
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  /* ---------------------------------------------------------------- */
  /*  Fetch leads                                                      */
  /* ---------------------------------------------------------------- */

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads')
      if (res.ok) {
        const data = await res.json()
        setLeads(data)
      }
    } catch (err) {
      console.error('Error fetching leads:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  /* ---------------------------------------------------------------- */
  /*  Stats                                                            */
  /* ---------------------------------------------------------------- */

  const stats = [
    { label: 'Total Leads',  value: leads.length,                                     icon: Users,    color: 'text-orange-400' },
    { label: 'New',          value: leads.filter((l) => l.status === 'new').length,     icon: UserPlus, color: 'text-blue-400' },
    { label: 'Interested',   value: leads.filter((l) => l.status === 'interested').length, icon: Star,     color: 'text-green-400' },
    { label: 'Called',       value: leads.filter((l) => l.status === 'called').length,  icon: Phone,    color: 'text-amber-400' },
  ]

  /* ---------------------------------------------------------------- */
  /*  Add / Edit                                                       */
  /* ---------------------------------------------------------------- */

  const resetForm = () => {
    setName('')
    setPhone('')
    setCompany('')
    setNotes('')
    setEditingLead(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setIsAddOpen(true)
  }

  const handleOpenEdit = (lead: Lead) => {
    setEditingLead(lead)
    setName(lead.name)
    setPhone(lead.phone)
    setCompany(lead.company || '')
    setNotes(lead.notes || '')
    setIsAddOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (editingLead) {
        const res = await fetch(`/api/leads/${editingLead.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, company, notes }),
        })
        if (!res.ok) throw new Error('Failed to update lead')
        const updated = await res.json()
        setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
        setToastMessage('Lead updated!')
        setToastType('success')
      } else {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, company, notes }),
        })
        if (!res.ok) throw new Error('Failed to create lead')
        const created = await res.json()
        setLeads((prev) => [created, ...prev])
        setToastMessage('Lead added!')
        setToastType('success')
      }
      setIsAddOpen(false)
      resetForm()
    } catch (err: any) {
      setToastMessage(err.message || 'Error saving lead')
      setToastType('error')
    } finally {
      setSaving(false)
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Delete                                                           */
  /* ---------------------------------------------------------------- */

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return
    try {
      const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== id))
        setToastMessage('Lead deleted')
        setToastType('success')
      }
    } catch {
      setToastMessage('Error deleting lead')
      setToastType('error')
    }
  }

  /* ---------------------------------------------------------------- */
  /*  CSV Import                                                       */
  /* ---------------------------------------------------------------- */

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const lines = text.split('\n').filter((l) => l.trim())
    // Expect header: name,phone,company
    const rows = lines.slice(1)

    let imported = 0
    for (const row of rows) {
      const [csvName, csvPhone, csvCompany] = row.split(',').map((s) => s.trim().replace(/^"|"$/g, ''))
      if (!csvPhone) continue

      try {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: csvName || 'Unknown', phone: csvPhone, company: csvCompany || '' }),
        })
        if (res.ok) {
          const created = await res.json()
          setLeads((prev) => [created, ...prev])
          imported++
        }
      } catch {
        // skip individual failures
      }
    }

    setToastMessage(`Imported ${imported} lead${imported !== 1 ? 's' : ''} from CSV`)
    setToastType('success')

    // reset input
    if (csvInputRef.current) csvInputRef.current.value = ''
  }

  /* ---------------------------------------------------------------- */
  /*  Call Lead                                                        */
  /* ---------------------------------------------------------------- */

  const handleOpenCall = (lead: Lead) => {
    setCallingLead(lead)
    setSelectedAgentId(agents[0]?.id || '')
    setFromNumber('')
    setIsCallOpen(true)
  }

  const handleInitiateCall = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!callingLead) return
    setInitiating(true)

    try {
      const res = await fetch('/api/calls/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: callingLead.id,
          agent_id: selectedAgentId,
          to_number: callingLead.phone,
          from_number: fromNumber,
        }),
      })
      if (!res.ok) throw new Error('Failed to initiate call')
      setToastMessage(`Call initiated to ${callingLead.name}`)
      setToastType('success')
      setIsCallOpen(false)
      // Refresh leads to get updated status
      fetchLeads()
    } catch (err: any) {
      setToastMessage(err.message || 'Error initiating call')
      setToastType('error')
    } finally {
      setInitiating(false)
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Lead Management</h1>
          <p className="text-sm text-slate-500">Manage your outbound call leads, import contacts, and initiate calls.</p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCSVImport}
          />
          <Button variant="outline" onClick={() => csvInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
                    <p className="text-2xl font-black text-slate-800">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Leads Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12 text-sm text-slate-400 italic">
              Loading leads...
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400 italic">
              No leads yet. Add a lead or import a CSV to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Called</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-semibold text-slate-800">
                      {lead.name}
                    </TableCell>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell className="text-slate-600 text-xs">
                      {lead.company || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {lead.last_called_at
                        ? `${new Date(lead.last_called_at).toLocaleDateString()} at ${new Date(lead.last_called_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs px-2.5 py-1 min-h-0"
                        onClick={() => handleOpenCall(lead)}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs px-2.5 py-1 min-h-0"
                        onClick={() => handleOpenEdit(lead)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-50 text-xs px-2.5 py-1 min-h-0"
                        onClick={() => handleDelete(lead.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
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

      {/* Add / Edit Lead Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => { setIsAddOpen(false); resetForm() }}
        title={editingLead ? 'Edit Lead' : 'Add Lead'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Name"
            placeholder="e.g. John Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Phone"
            placeholder="e.g. +1 555-123-4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <Input
            label="Company"
            placeholder="e.g. Acme Corp (optional)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />

          <Textarea
            label="Notes"
            placeholder="Any additional notes about this lead..."
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <Button type="submit" className="w-full" isLoading={saving}>
            {editingLead ? 'Update Lead' : 'Add Lead'}
          </Button>
        </form>
      </Modal>

      {/* Call Lead Modal */}
      <Modal
        isOpen={isCallOpen}
        onClose={() => setIsCallOpen(false)}
        title="Initiate Outbound Call"
      >
        {callingLead && (
          <form onSubmit={handleInitiateCall} className="space-y-4">
            {/* Lead Info */}
            <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-100 pb-3">
              <div>
                <span className="font-bold text-slate-400 block uppercase">Lead</span>
                <span className="text-sm font-semibold text-slate-800">
                  {callingLead.name}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-400 block uppercase">Phone</span>
                <span className="text-sm font-semibold text-slate-800">
                  {callingLead.phone}
                </span>
              </div>
            </div>

            {/* Select Agent */}
            <div className="w-full space-y-1">
              <label className="text-xs font-semibold text-slate-500">
                Select AI Agent
              </label>
              <select
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 transition-all duration-150"
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                required
              >
                <option value="">Choose an agent...</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.voice})
                  </option>
                ))}
              </select>
            </div>

            {/* From Number */}
            <Input
              label="From Number (Your Twilio Number)"
              placeholder="Leave blank to use default (+19516291101)"
              value={fromNumber}
              onChange={(e) => setFromNumber(e.target.value)}
            />

            <Button type="submit" className="w-full" isLoading={initiating}>
              <Phone className="h-4 w-4 mr-2" />
              Start Call
            </Button>
          </form>
        )}
      </Modal>

      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}
    </div>
  )
}
