'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/lib/utils'
import type { Employee } from '@/types'
import AddHistoricalLeaveForm from '@/components/admin/AddHistoricalLeaveForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type LeaveRequest = {
  id: string
  leave_type: string
  from_date: string
  to_date: string
  days: number
  reason: string | null
  status: string
  admin_note: string | null
  employee: { name: string; employee_id: string }
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const statusBadge: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
}

export default function AdminLeavesPage() {
  const now = new Date()
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [acting, setActing] = useState<string | null>(null)
  const [filterYear, setFilterYear] = useState(now.getFullYear())
  const [filterMonth, setFilterMonth] = useState(now.getMonth())
  const [filterStatus, setFilterStatus] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [leavesRes, empRes] = await Promise.all([
        fetch('/api/leaves'),
        fetch('/api/employees'),
      ])
      if (!leavesRes.ok) throw new Error('Failed to load leaves')
      setLeaves(await leavesRes.json())
      if (empRes.ok) setEmployees(await empRes.json())
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load leaves'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const review = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setActing(id)
    try {
      const res = await fetch('/api/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, admin_note: notes[id] || '' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update leave')
      toast.success(`Leave ${status.toLowerCase()}`)
      load()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to update leave'))
    } finally {
      setActing(null)
    }
  }

  // Filter leaves by selected month/year
  const filtered = leaves.filter(l => {
    const from = new Date(l.from_date)
    const inMonth = from.getFullYear() === filterYear && from.getMonth() === filterMonth
    if (!inMonth) return false
    if (filterStatus !== 'all' && l.status !== filterStatus) return false
    return true
  })

  const pendingCount = leaves.filter(l => l.status === 'PENDING').length
  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i)

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold text-text-primary">Leave Requests</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {pendingCount > 0
            ? `${pendingCount} pending request(s) need your review`
            : 'Approve requests or backfill historical leave'}
        </p>
      </header>

      <AddHistoricalLeaveForm employees={employees} onSuccess={load} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-text-secondary">Filter:</span>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select
          value={filterYear}
          onChange={e => setFilterYear(Number(e.target.value))}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={filterMonth}
          onChange={e => setFilterMonth(Number(e.target.value))}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
      </div>

      <div className="rounded-xl border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-text-muted">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-text-muted">
                  No leave requests for this period
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((l) => (
                <TableRow key={l.id} className={l.status === 'PENDING' ? 'bg-yellow-50/50' : ''}>
                  <TableCell>
                    <div className="font-medium">{l.employee.name}</div>
                    <div className="text-xs text-text-muted">{l.employee.employee_id}</div>
                  </TableCell>
                  <TableCell>{l.leave_type}</TableCell>
                  <TableCell>{l.from_date}</TableCell>
                  <TableCell>{l.to_date}</TableCell>
                  <TableCell className="font-medium">{l.days}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge[l.status] || 'bg-gray-100 text-gray-700'}`}>
                      {l.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {l.status === 'PENDING' ? (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <Input
                          placeholder="Admin note (optional)"
                          value={notes[l.id] || ''}
                          onChange={(e) =>
                            setNotes((n) => ({ ...n, [l.id]: e.target.value }))
                          }
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={acting === l.id}
                            onClick={() => review(l.id, 'APPROVED')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={acting === l.id}
                            onClick={() => review(l.id, 'REJECTED')}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted">{l.admin_note || '—'}</span>
                    )}
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
