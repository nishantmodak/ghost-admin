import type { Metadata } from 'next'
import { ToastProvider } from '@/components/ui/toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ghost Scripts - Admin Toolkit',
  description: 'A local admin toolkit for Ghost CMS that addresses common pain points',
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">👻</text></svg>',
        type: 'image/svg+xml',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-ghost-bg font-sans">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
