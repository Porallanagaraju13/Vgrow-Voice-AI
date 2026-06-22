'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { PhoneOutgoing, Play, MessageSquare, Clock, CheckCircle, Loader2, BarChart3 } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type CallStatus = 'initiated' | 'ringing' | 'in_progress' | 'completed' | 'failed' | 'no_answer' | 'busy'
type Sentiment = 'positive' | 'neutral' | 'negative'

interface TranscriptLine {
  role: 'user' | 'model'
  text: string
  timestamp?: string
}

interface OutboundCall {
  id: string
  business_id: string
  lead_id?: string
  agent_id?: string
  lead_name?: string
  lead_phone: string
  agent_name?: string
  from_number: string
  status: CallStatus
  duration: number // seconds
  sentiment?: Sentiment
  transcript: TranscriptLine[]
  summary?: string
  recording_url?: string
  created_at: string
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const callStatusConfig: Record<CallStatus, { label: string; className: string }> = {
  initiated:   { label: 'Initiated',   className: 'bg-blue-100 text-blue-800' },
  ringing:     { label: 'Ringing',     className: 'bg-amber-100 text-amber-800' },
  in_progress: { label: 'In Progress', className: 'bg-yellow-100 text-yellow-800' },
  completed:   { label: 'Completed',   className: 'bg-green-100 text-green-800' },
  failed:      { label: 'Failed',      className: 'bg-red-100 text-red-800' },
  no_answer:   { label: 'No Answer',   className: 'bg-slate-100 text-slate-600' },
  busy:        { label: 'Busy',        className: 'bg-orange-100 text-orange-800' },
}

const sentimentConfig: Record<Sentiment, { label: string; className: string }> = {
  positive: { label: 'Positive', className: 'bg-green-100 text-green-800' },
  neutral:  { label: 'Neutral',  className: 'bg-blue-100 text-blue-800' },
  negative: { label: 'Negative', className: 'bg-red-100 text-red-800' },
}

function CallStatusBadge({ status }: { status: CallStatus }) {
  const cfg = callStatusConfig[status] ?? callStatusConfig.initiated
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

function SentimentBadge({ sentiment }: { sentiment?: Sentiment }) {
  if (!sentiment) return <span className="text-xs text-slate-500 italic">N/A</span>
  const cfg = sentimentConfig[sentiment]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function OutboundCallsPage() {
  /* ---- Data State ---- */
  const [calls, setCalls] = useState<OutboundCall[]>([])
  const [loading, setLoading] = useState(true)

  /* ---- Modal State ---- */
  const [selectedCall, setSelectedCall] = useState<OutboundCall | null>(null)

  /* ---------------------------------------------------------------- */
  /*  Fetch calls                                                      */
  /* ---------------------------------------------------------------- */

  const fetchCalls = useCallback(async () => {
    try {
      const res = await fetch('/api/calls/outbound')
      if (res.ok) {
        const data = await res.json()
        setCalls(data)
      }
    } catch (err) {
      console.error('Error fetching outbound calls:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCalls()
  }, [fetchCalls])

  /* ---------------------------------------------------------------- */
  /*  Stats                                                            */
  /* ---------------------------------------------------------------- */

  const totalCalls = calls.length
  const completedCalls = calls.filter((c) => c.status === 'completed').length
  const inProgressCalls = calls.filter((c) => c.status === 'in_progress' || c.status === 'ringing' || c.status === 'initiated').length
  const avgDuration = completedCalls > 0
    ? Math.round(calls.filter((c) => c.status === 'completed').reduce((sum, c) => sum + c.duration, 0) / completedCalls)
    : 0

  const stats = [
    { label: 'Total Calls',    value: totalCalls.toString(),          icon: PhoneOutgoing, color: 'text-orange-400' },
    { label: 'Completed',      value: completedCalls.toString(),      icon: CheckCircle,   color: 'text-green-400' },
    { label: 'In Progress',    value: inProgressCalls.toString(),     icon: Loader2,       color: 'text-amber-400' },
    { label: 'Avg Duration',   value: formatDuration(avgDuration),    icon: Clock,         color: 'text-blue-400' },
  ]

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800">Outbound Calls</h1>
        <p className="text-sm text-slate-500">Track AI-powered outbound call history, recordings, transcripts, and sentiment analysis.</p>
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

      {/* Calls Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12 text-sm text-slate-400 italic">
              Loading outbound calls...
            </div>
          ) : calls.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400 italic">
              No outbound calls yet. Initiate calls from the Leads page.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Sentiment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recording</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell className="font-semibold text-slate-800">
                      {call.lead_name || 'Unknown'}
                    </TableCell>
                    <TableCell>{call.lead_phone}</TableCell>
                    <TableCell className="text-slate-600 text-xs">
                      {call.agent_name || 'AI Agent'}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center space-x-1 text-slate-700">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{formatDuration(call.duration)}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <SentimentBadge sentiment={call.sentiment} />
                    </TableCell>
                    <TableCell>
                      <CallStatusBadge status={call.status} />
                    </TableCell>
                    <TableCell>
                      {call.recording_url ? (
                        <audio
                          controls
                          preload="none"
                          className="h-8 w-36"
                        >
                          <source src={call.recording_url} type="audio/mpeg" />
                        </audio>
                      ) : (
                        <span className="text-xs text-slate-500 italic">No recording</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs px-2.5 py-1 min-h-0"
                        onClick={() => setSelectedCall(call)}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Transcript
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Transcript Details Modal */}
      <Modal
        isOpen={!!selectedCall}
        onClose={() => setSelectedCall(null)}
        title="Outbound Call Details"
      >
        {selectedCall && (
          <div className="space-y-4">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-100 pb-3">
              <div>
                <span className="font-bold text-slate-400 block uppercase">Lead</span>
                <span className="text-sm font-semibold text-slate-800">
                  {selectedCall.lead_name || 'Unknown'} ({selectedCall.lead_phone})
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-400 block uppercase">Duration</span>
                <span className="text-sm font-semibold text-slate-800">
                  {formatDuration(selectedCall.duration)}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-400 block uppercase">Status</span>
                <div className="mt-1">
                  <CallStatusBadge status={selectedCall.status} />
                </div>
              </div>
              <div>
                <span className="font-bold text-slate-400 block uppercase">Sentiment</span>
                <div className="mt-1">
                  <SentimentBadge sentiment={selectedCall.sentiment} />
                </div>
              </div>
            </div>

            {/* AI Summary */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">AI Summary</span>
              <p className="text-sm text-slate-750 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed italic">
                {selectedCall.summary || 'No summary generated.'}
              </p>
            </div>

            {/* Recording */}
            {selectedCall.recording_url && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Recording</span>
                <audio controls className="w-full" preload="none">
                  <source src={selectedCall.recording_url} type="audio/mpeg" />
                </audio>
              </div>
            )}

            {/* Transcript Lines */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              <span className="text-xs font-bold text-slate-400 uppercase block">Transcript Dialog</span>
              {(!selectedCall.transcript || selectedCall.transcript.length === 0) ? (
                <p className="text-xs text-slate-400 italic">No dialogue was recorded during this call.</p>
              ) : (
                selectedCall.transcript.map((line: TranscriptLine, idx: number) => (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[90%] rounded-lg p-2.5 text-xs ${
                      line.role === 'user'
                        ? 'bg-orange-50 text-slate-800 ml-auto border border-orange-100'
                        : 'bg-slate-50 border border-slate-200/50 text-slate-700 mr-auto'
                    }`}
                  >
                    <span className="font-extrabold uppercase text-3xs opacity-65 mb-0.5">
                      {line.role === 'user' ? 'Lead' : 'AI Agent'}
                    </span>
                    <p className="leading-relaxed">{line.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
