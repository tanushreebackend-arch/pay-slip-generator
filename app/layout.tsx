import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import Providers from './providers'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PayGen — Payslip & Letter Generator',
  description: 'Generate payslips and HR letters',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto bg-surface p-8 print:bg-white print:p-0">
              <div className="mx-auto max-w-[1100px] print:max-w-none">{children}</div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
