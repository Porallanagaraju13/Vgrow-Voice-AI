'use client'
import React, { useState } from 'react'
import { useBusinessStore } from '@/store/business'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'

export default function CallLogsPage() {
  const { conversations } = useBusinessStore()
  const [selectedCall, setSelectedCall] = useState<any | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Conversation Call Logs</h1>
        <p className="text-sm text-slate-500">Review recordings, transcripts, and AI-generated summaries of previous calls.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400 italic">
              No conversations logged yet...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Call Type</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>AI Summary</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.map((call: any) => (
                  <TableRow key={call.id}>
                    <TableCell>
                      <Badge variant={call.type === 'outbound' ? 'secondary' : 'primary'} className="text-3xs uppercase tracking-wider">
                        {call.type === 'outbound' ? 'Outbound' : 'Inbound'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800">
                      {call.customer_name || 'Anonymous Guest'}
                    </TableCell>
                    <TableCell>{call.customer_phone || 'N/A'}</TableCell>
                    <TableCell>{call.agent?.name || 'Receptionist'}</TableCell>
                    <TableCell>{call.duration}s</TableCell>
                    <TableCell>
                      {new Date(call.created_at).toLocaleDateString()} at{' '}
                      {new Date(call.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                      {call.summary || 'No summary generated yet.'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs px-2.5 py-1 min-h-0"
                        onClick={() => setSelectedCall(call)}
                      >
                        View Transcript
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
        title="Call Session Log Details"
      >
        {selectedCall && (
          <div className="space-y-4">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-100 pb-3">
              <div>
                <span className="font-bold text-slate-400 block uppercase">Customer</span>
                <span className="text-sm font-semibold text-slate-800">
                  {selectedCall.customer_name || 'Anonymous'} ({selectedCall.customer_phone || 'N/A'})
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-400 block uppercase">Duration</span>
                <span className="text-sm font-semibold text-slate-800">
                  {selectedCall.duration} seconds
                </span>
              </div>
            </div>

            {/* AI Summary */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">AI Summary</span>
              <p className="text-sm text-slate-750 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed italic">
                {selectedCall.summary || 'No summary generated.'}
              </p>
            </div>

            {/* Transcripts lines */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              <span className="text-xs font-bold text-slate-400 uppercase block">Transcript Dialog</span>
              {selectedCall.transcript.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No dialogue was recorded during this call.</p>
              ) : (
                selectedCall.transcript.map((line: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[90%] rounded-lg p-2.5 text-xs ${
                      line.role === 'user'
                        ? 'bg-orange-50 text-slate-800 ml-auto border border-orange-100'
                        : 'bg-slate-50 border border-slate-200/50 text-slate-700 mr-auto'
                    }`}
                  >
                    <span className="font-extrabold uppercase text-3xs opacity-65 mb-0.5">
                      {line.role === 'user' ? 'Caller' : 'AI Agent'}
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
