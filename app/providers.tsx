'use client'

import { Toaster } from 'react-hot-toast'
import { SettingsProvider } from '@/context/SettingsContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      {children}
      <Toaster position="top-right" />
    </SettingsProvider>
  )
}
