'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { emptySettings } from '@/lib/utils'
import type { PayslipCustomField, Settings } from '@/types'

function parsePayslipCustomFields(raw: unknown): PayslipCustomField[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Record<string, unknown>
      return {
        label: String(row.label ?? '').trim(),
        value: String(row.value ?? '').trim(),
      }
    })
    .filter((row): row is PayslipCustomField => row !== null)
}

interface SettingsContextValue {
  settings: Settings
  loading: boolean
  refetch: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: emptySettings as Settings,
  loading: true,
  refetch: async () => {},
})

function mapSettings(row: Record<string, unknown>): Settings {
  return {
    id: String(row.id ?? ''),
    company_name: String(row.company_name ?? ''),
    address: String(row.address ?? ''),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    website: String(row.website ?? ''),
    signatory_name: String(row.signatory_name ?? ''),
    signatory_designation: String(row.signatory_designation ?? ''),
    logo_url: String(row.logo_url ?? ''),
    signature_url: String(row.signature_url ?? ''),
    payslip_custom_fields: parsePayslipCustomFields(row.payslip_custom_fields),
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(emptySettings as Settings)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .maybeSingle()

      if (error) throw error
      if (data) {
        setSettings(mapSettings(data))
      } else {
        setSettings(emptySettings as Settings)
      }
    } catch {
      setSettings(emptySettings as Settings)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return (
    <SettingsContext.Provider value={{ settings, loading, refetch }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
