'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/lib/utils'
import type { Employee } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type AttendanceRecord = {
  id: string
  date: string
  check_in: string
  check_out: string | null
  employee: { id?: string; name: string; employee_id: string }
}

function toTimeInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function combineDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString()
}

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    check_in: '09:30',
    check_out: '18:30',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [attRes, empRes] = await Promise.all([
        fetch('/api/attendance'),
        fetch('/api/employees'),
      ])
      if (!attRes.ok) throw new Error('Failed to load attendance')
      if (!empRes.ok) throw new Error('Failed to load employees')
      setRecords(await attRes.json())
      setEmployees(await empRes.json())
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load attendance'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const formatTime = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'

  const resetForm = () => {
    setEditingId(null)
    setForm({
      employee_id: '',
      date: new Date().toISOString().split('T')[0],
      check_in: '09:30',
      check_out: '18:30',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.employee_id || !form.date || !form.check_in) {
      toast.error('Employee, date, and check-in are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        employee_id: form.employee_id,
        date: form.date,
        check_in: combineDateTime(form.date, form.check_in),
        check_out: form.check_out ? combineDateTime(form.date, form.check_out) : null,
      }

      const res = editingId
        ? await fetch('/api/attendance', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: editingId,
              check_in: payload.check_in,
              check_out: payload.check_out,
            }),
          })
        : await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to save attendance')
      toast.success(editingId ? 'Attendance updated' : 'Attendance saved')
      resetForm()
      await load()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to save attendance'))
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (row: AttendanceRecord) => {
    const emp = employees.find((e) => e.employee_id === row.employee.employee_id)
    setEditingId(row.id)
    setForm({
      employee_id: emp?.id || row.employee.id || '',
      date: row.date,
      check_in: toTimeInput(row.check_in),
      check_out: toTimeInput(row.check_out),
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this attendance record?')) return
    try {
      const res = await fetch(`/api/attendance?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Record deleted')
      if (editingId === id) resetForm()
      await load()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to delete'))
    }
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Attendance Overview</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Add or edit a day’s attendance. Employees can also check in from their portal. This does
          not change payslip LOP.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mb-6 grid gap-4 rounded-xl border border-border bg-background p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="space-y-2 lg:col-span-2">
          <Label>Employee</Label>
          <Select
            value={form.employee_id}
            onValueChange={(v) => setForm((prev) => ({ ...prev, employee_id: v }))}
            disabled={!!editingId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employee_id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            disabled={!!editingId}
          />
        </div>
        <div className="space-y-2">
          <Label>Check in</Label>
          <Input
            type="time"
            value={form.check_in}
            onChange={(e) => setForm((prev) => ({ ...prev, check_in: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Check out</Label>
          <Input
            type="time"
            value={form.check_out}
            onChange={(e) => setForm((prev) => ({ ...prev, check_out: e.target.value }))}
          />
        </div>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update record' : 'Save attendance'}
          </Button>
          {editingId ? (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      <div className="rounded-xl border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-text-muted">
                  Loading...
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-text-muted">
                  No attendance records yet
                </TableCell>
              </TableRow>
            ) : (
              records.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.employee.name}</TableCell>
                  <TableCell>{r.employee.employee_id}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{formatTime(r.check_in)}</TableCell>
                  <TableCell>{formatTime(r.check_out)}</TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(r)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(r.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
