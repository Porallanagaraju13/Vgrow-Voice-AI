import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import '@/styles/globals.css'

const outfit = Outfit({ 
  subsets: ['latin'],
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: 'VgrowVoice AI | Business Growth Platform',
  description: 'Full-stack AI Voice Agent platform powered by Gemini Live API',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans bg-surface-50 text-surface-900 antialiased selection:bg-primary selection:text-white`}>
        {children}
      </body>
    </html>
  )
}
