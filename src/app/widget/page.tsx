'use client'
import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import VoiceWidget from '@/components/voice/VoiceWidget'

function WidgetContent() {
  const searchParams = useSearchParams()
  const agentId = searchParams.get('agentId')

  if (!agentId) {
    return (
      <div className="text-xs text-red-500 p-2 bg-white rounded border">
        Error: agentId query parameter is missing.
      </div>
    )
  }

  return (
    <div className="fixed inset-0 pointer-events-none flex items-end justify-end">
      <div className="pointer-events-auto">
        <VoiceWidget agentId={agentId} />
      </div>
    </div>
  )
}

export default function PublicWidgetPage() {
  return (
    <Suspense fallback={null}>
      <WidgetContent />
    </Suspense>
  )
}
