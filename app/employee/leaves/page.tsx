'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getErrorMessage, calculateLeaveDays } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, CalendarDays } from 'lucide-react'

type LeaveRequest = {
  id: string
  leave_type: string
  from_date: string
  to_date: string
  days: number
  reason: string | null
  status: string
  admin_note: string | null
}

type PaySummary = {
  paidLeaveRemaining: number
  approvedLeaveDays: number
  paidAllowanceDays: number
  carryForwardDays: number
}

const LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Comp-Off']

const statusBadge: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
}

export default function EmployeeLeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [paySummary, setPaySummary] = useState<PaySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    leave_type: LEAVE_TYPES[0],
    from_date: '',
    to_date: '',
    reason: '',
    half_day: false,
  })

  const isSingleDay = form.from_date && form.to_date && form.from_date === form.to_date
  const leaveDays = form.from_date && form.to_date
    ? form.half_day && isSingleDay
      ? 0.5
      : calculateLeaveDays(form.from_date, form.to_date)
    : 0

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [leavesRes, dashRes] = await Promise.all([
        fetch('/api/leaves'),
        fetch('/api/employee/dashboard'),
      ])
      if (!leavesRes.ok) throw new Error('Failed to load leaves')
      setLeaves(await leavesRes.json())
      if (dashRes.ok) {
        const d = await dashRes.json()
        setPaySummary(d.pay_summary)
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load leaves'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.from_date || !form.to_date) {
      toast.error('Please select date range')
      return
    }
    if (leaveDays <= 0) {
      toast.error('To date must be on or after from date')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, half_day: form.half_day && isSingleDay }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit leave')
      toast.success('Leave request submitted')
      setForm({ leave_type: LEAVE_TYPES[0], from_date: '', to_date: '', reason: '', half_day: false })
      setOpen(false)
      load()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to submit leave'))
    } finally {
      setSubmitting(false)
    }
  }

  const leavesByType = (type: string) =>
    leaves.filter(l => l.leave_type === type && l.status === 'APPROVED')
      .reduce((sum, l) => sum + l.days, 0)

  const balanceCards = [
    { type: 'Casual', color: 'bg-yellow-50 border-yellow-200', value: paySummary ? paySummary.paidLeaveRemaining : 0 },
    { type: 'Sick', color: 'bg-green-50 border-green-200', value: Math.max(0, 0.5 - leavesByType('Sick Leave')) },
    { type: 'Earned', color: 'bg-blue-50 border-blue-200', value: Math.max(0, 0 - leavesByType('Earned Leave')) },
    { type: 'Comp-Off', color: 'bg-purple-50 border-purple-200', value: Math.max(0, 0 - leavesByType('Comp-Off')) },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-accent-light px-6 py-4 text-center">
        <h1 className="text-xl font-semibold text-text-primary">
          Leave <span className="text-accent">Management</span>
        </h1>
      </div>

      {/* Header with description + Apply Leave button */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            Leave <span className="text-accent">Management</span>
          </h2>
          <p className="text-sm text-text-secondary">
            Track your leave balances, apply for leave and manage organization requests.
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="gap-1.5 bg-accent hover:bg-accent-hover text-white"
        >
          <Plus className="h-4 w-4" /> Apply Leave
        </Button>
      </div>

      {/* Leave balance cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {balanceCards.map(({ type, color, value }) => (
          <div key={type} className={`rounded-xl border p-5 ${color}`}>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{type}</p>
            <p className="mt-1 text-3xl font-bold text-text-primary">{value}</p>
          </div>
        ))}
      </div>

      {/* Leave History */}
      <div>
        <h3 className="mb-3 text-base font-semibold text-text-primary">My Leave History</h3>
        <div className="rounded-xl border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>LEAVE TYPE</TableHead>
                <TableHead>DURATION</TableHead>
                <TableHead>DAYS</TableHead>
                <TableHead>REASON</TableHead>
                <TableHead>STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-text-muted">Loading...</TableCell>
                </TableRow>
              ) : leaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-text-muted">No leave requests yet</TableCell>
                </TableRow>
              ) : (
                leaves.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">
                      {l.leave_type.replace(' Leave', '')}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {l.from_date} - {l.to_date}
                    </TableCell>
                    <TableCell className="text-center font-medium">{l.days}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-text-secondary">
                      {l.reason || '-'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadge[l.status] || 'bg-gray-100 text-gray-700'}`}>
                        {l.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-light">
                <CalendarDays className="h-5 w-5 text-accent" />
              </div>
              <DialogTitle className="text-lg">Apply for Leave</DialogTitle>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="font-semibold">Leave Type</Label>
              <select
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={form.leave_type}
                onChange={e => setForm(f => ({ ...f, leave_type: e.target.value }))}
              >
                {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="half_day_modal"
                checked={form.half_day}
                onChange={e => setForm(f => ({ ...f, half_day: e.target.checked }))}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="half_day_modal" className="cursor-pointer font-normal">
                Apply as Half Day
              </Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.from_date}
                  onChange={e => setForm(f => ({ ...f, from_date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">
                  End Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.to_date}
                  onChange={e => setForm(f => ({ ...f, to_date: e.target.value }))}
                  min={form.from_date || undefined}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">
                Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                placeholder="Briefly state your reason..."
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-accent hover:bg-accent-hover text-white"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
