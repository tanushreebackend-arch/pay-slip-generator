'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Holiday = { id: string; name: string; date: string }

export default function PublicHolidaysManager() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ date: '', name: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/holidays?year=${year}`)
      if (!res.ok) throw new Error('Failed to load holidays')
      setHolidays(await res.json())
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load holidays'))
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    load()
  }, [load])

  const addHoliday = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date || !form.name.trim()) {
      toast.error('Date and holiday name are required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: form.date, name: form.name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add holiday')
      toast.success('Holiday added')
      setForm({ date: '', name: '' })
      load()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to add holiday'))
    } finally {
      setSaving(false)
    }
  }

  const removeHoliday = async (id: string) => {
    if (!confirm('Remove this public holiday?')) return
    try {
      const res = await fetch(`/api/holidays?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete holiday')
      toast.success('Holiday removed')
      load()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to delete holiday'))
    }
  }

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]

  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Public Holidays</h2>
          <p className="text-sm text-text-secondary">
            These dates appear on every employee dashboard as Holidays & Events.
          </p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={addHoliday} className="mb-4 grid gap-3 sm:grid-cols-[160px_1fr_auto]">
        <div className="space-y-1">
          <Label className="text-xs">Date</Label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Holiday name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Independence Day"
            required
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={saving}>
            {saving ? 'Adding...' : 'Add Holiday'}
          </Button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-text-muted">Loading holidays...</p>
      ) : holidays.length === 0 ? (
        <p className="text-sm text-text-muted">No public holidays for {year} yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {holidays.map((h) => {
            const d = new Date(h.date + 'T12:00:00')
            const month = d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()
            const day = d.getDate()
            return (
              <li key={h.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <span className="text-[10px] font-semibold leading-none">{month}</span>
                    <span className="text-lg font-bold leading-tight">{day}</span>
                  </div>
                  <p className="text-sm font-medium text-text-primary">{h.name}</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeHoliday(h.id)}>
                  Remove
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
