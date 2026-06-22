'use client'
import React, { useState } from 'react'
import { useBusinessStore } from '@/store/business'
import { appointmentsService } from '@/services/appointments'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Toast } from '@/components/ui/Toast'

export default function AppointmentsPage() {
  const { appointments, updateAppointment } = useBusinessStore()
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const handleUpdateStatus = async (id: string, status: 'scheduled' | 'completed' | 'cancelled') => {
    try {
      const updated = await appointmentsService.updateAppointment(id, { status })
      if (updated) {
        updateAppointment(updated)
        setToastMessage(`Booking status updated to ${status}`)
        setToastType('success')
      }
    } catch (err) {
      setToastMessage('Failed to update booking status')
      setToastType('error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Scheduled Appointments</h1>
        <p className="text-sm text-slate-500">Track and reschedule bookings created by your AI voice receptionist.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {appointments.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400 italic">
              No appointments scheduled yet. Give your widget key a spin!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Customer Phone</TableHead>
                  <TableHead>Service Offer</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appt) => (
                  <TableRow key={appt.id}>
                    <TableCell className="font-semibold text-slate-800">{appt.customer_name}</TableCell>
                    <TableCell>{appt.customer_phone}</TableCell>
                    <TableCell>{appt.service?.name || 'General Consultation'}</TableCell>
                    <TableCell>
                      {new Date(appt.start_time).toLocaleDateString()} at{' '}
                      {new Date(appt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          appt.status === 'scheduled'
                            ? 'primary'
                            : appt.status === 'completed'
                            ? 'success'
                            : 'danger'
                        }
                        className="capitalize"
                      >
                        {appt.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-xs truncate">{appt.notes || 'No notes'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {appt.status === 'scheduled' && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs px-2 py-1 min-h-0"
                            onClick={() => handleUpdateStatus(appt.id, 'completed')}
                          >
                            Mark Completed
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 text-xs px-2 py-1 min-h-0"
                            onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      )}
    </div>
  )
}
