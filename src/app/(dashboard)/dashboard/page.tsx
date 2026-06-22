'use client'
import React from 'react'
import { useBusinessStore } from '@/store/business'
import { AnalyticsCard } from '@/components/ui/AnalyticsCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PhoneCall, CalendarDays, Percent, Clock } from 'lucide-react'
import Link from 'next/link'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const mockChartData = [
  { date: 'Mon', calls: 12, appointments: 4 },
  { date: 'Tue', calls: 19, appointments: 7 },
  { date: 'Wed', calls: 15, appointments: 5 },
  { date: 'Thu', calls: 25, appointments: 12 },
  { date: 'Fri', calls: 22, appointments: 9 },
  { date: 'Sat', calls: 8, appointments: 2 },
  { date: 'Sun', calls: 5, appointments: 1 },
]

const mockPieData = [
  { name: 'Positive', value: 65 },
  { name: 'Neutral', value: 31 },
  { name: 'Negative', value: 10 },
]

const COLORS = ['#10b981', '#0ea5e9', '#ef4444']

export default function OverviewPage() {
  const { appointments, conversations, agents } = useBusinessStore()

  // Calculate metrics
  const totalCalls = conversations.length
  const totalAppointments = appointments.length
  const completedCalls = conversations.filter(c => c.status === 'completed')
  const avgDuration = completedCalls.length > 0 
    ? Math.round(completedCalls.reduce((acc, c) => acc + c.duration, 0) / completedCalls.length)
    : 0

  // Calculate conversion rate (percentage of calls that resulted in booking)
  const conversionRate = totalCalls > 0 
    ? Math.round((totalAppointments / totalCalls) * 100) 
    : 0

  // Filter next 5 upcoming appointments
  const upcoming = appointments
    .filter(a => new Date(a.start_time) >= new Date() && a.status === 'scheduled')
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Overview Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome to your voice agent control center.</p>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard
          title="Total Conversations"
          value={totalCalls}
          icon={<PhoneCall className="h-5 w-5" />}
          trend={{ value: 12, label: 'vs last week', isPositive: true }}
        />
        <AnalyticsCard
          title="Scheduled Appointments"
          value={totalAppointments}
          icon={<CalendarDays className="h-5 w-5" />}
          trend={{ value: 8, label: 'vs last week', isPositive: true }}
        />
        <AnalyticsCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          icon={<Percent className="h-5 w-5" />}
          trend={{ value: 4, label: 'vs last week', isPositive: true }}
        />
        <AnalyticsCard
          title="Avg Call Duration"
          value={`${avgDuration}s`}
          icon={<Clock className="h-5 w-5" />}
          trend={{ value: 3, label: 'vs last week', isPositive: false }}
        />
      </div>

      {/* Analytics Graph & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Call Volume & Appointments (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAppts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="calls" name="Total Calls" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorCalls)" />
                  <Area type="monotone" dataKey="appointments" name="Appointments" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorAppts)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Call Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {mockPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Centered Total */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-slate-800">106</span>
                <span className="text-xs text-slate-400">Total</span>
              </div>
            </div>
            <div className="mt-4 flex flex-col space-y-2">
              {mockPieData.map((entry, idx) => (
                <div key={entry.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[idx] }}></span>
                    <span className="text-slate-600">{entry.name}</span>
                  </div>
                  <span className="font-semibold text-slate-800">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Upcoming Appointments */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Appointments</CardTitle>
            <Link href="/dashboard/appointments">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <div className="text-center py-12 text-sm text-slate-400 italic">
                No upcoming appointments scheduled...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcoming.map((appt) => (
                    <TableRow key={appt.id}>
                      <TableCell className="font-semibold">{appt.customer_name}</TableCell>
                      <TableCell>{appt.customer_phone}</TableCell>
                      <TableCell>{appt.service?.name || 'Consultation'}</TableCell>
                      <TableCell>
                        {new Date(appt.start_time).toLocaleDateString()} at{' '}
                        {new Date(appt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="primary" className="capitalize">{appt.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Right: Active Agents Status */}
        <Card>
          <CardHeader>
            <CardTitle>AI Agents Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {agents.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-400 italic">
                No agents configured yet...
              </div>
            ) : (
              agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-3.5 border border-slate-100 rounded-lg bg-slate-50/50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-sm">
                      🤖
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{agent.name}</p>
                      <p className="text-xs text-slate-400 capitalize">Voice: {agent.voice}</p>
                    </div>
                  </div>
                  <Badge variant={agent.is_active ? 'success' : 'secondary'}>
                    {agent.is_active ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
              ))
            )}
            <Link href="/dashboard/agents" className="block w-full">
              <Button variant="outline" className="w-full text-xs">
                Manage Agents
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
