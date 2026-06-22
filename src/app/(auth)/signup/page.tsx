'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/Card'
import { businessService } from '@/services/business'

const industries = [
  { value: 'auto_repair', label: 'Auto Repair Shop' },
  { value: 'healthcare', label: 'Healthcare Clinic' },
  { value: 'restaurant', label: 'Restaurant / Dining' },
  { value: 'custom', label: 'Other Business Type' },
]

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('auto_repair')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    
    // 1. Sign up user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError || !authData.user) {
      setError(signUpError?.message || 'Authentication signup failed')
      setLoading(false)
      return
    }

    try {
      // 2. Insert profile record via API route (uses admin client to bypass RLS)
      const res = await fetch('/api/auth/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authData.user.id,
          name,
          industry,
          email,
          phone,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Failed to setup your business profile record')
        setLoading(false)
        return
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Error configuring business profile')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md border border-slate-150 bg-white shadow-xl shadow-slate-200/50 rounded-2xl text-slate-800">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-black text-slate-900">Create Account</CardTitle>
          <CardDescription className="text-slate-500">
            Setup your voice receptionist SaaS subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            
            <Input
              label="Business Name"
              type="text"
              placeholder="e.g. Apex Auto Body"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-orange-500"
            />

            <Select
              label="Industry / Domain"
              options={industries}
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
              className="bg-slate-50 border-slate-200 text-slate-900 focus-visible:ring-orange-500"
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="+1 (555) 019-2834"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-orange-500"
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="billing@apexauto.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-orange-500"
            />
            
            <Input
              label="Password"
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-orange-500"
            />

            <Button type="submit" className="w-full" isLoading={loading}>
              Register Business
            </Button>
          </form>

          <div className="text-center mt-6 text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-orange-400 hover:text-orange-300 font-semibold underline">
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
