import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Done List',
  description: 'An app to track everyday choices and patterns',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

