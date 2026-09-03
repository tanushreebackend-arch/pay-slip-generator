'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/lib/utils'
import { TrendingUp, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ATTENDANCE_FILTER_OPTIONS,
  ATTENDANCE_STATUS_BADGE,
  ATTENDANCE_STATUS_LABELS,
  dateKey,
  formatWorkedHours,
  getAttendanceStatus,
  getWorkedMs,
  type AttendanceStatus,
  type LeaveCover,
} from '@/lib/attendanceRules'

type AttendanceRecord = {
  id?: string
  date: string
  check_in: string | null
  check_out: string | null
  notes: string | null
}

type Holiday = { date: string }

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function EmployeeAttendancePage() {
  const now = new Date()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [leaves, setLeaves] = useState<LeaveCover[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [joiningDate, setJoiningDate] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('All Statuses')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const lastDay = new Date(year, month + 1, 0).getDate()
      const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      const [attRes, leaveRes, holRes, dashRes] = await Promise.all([
        fetch(`/api/attendance?from=${from}&to=${to}`),
        fetch('/api/leaves'),
        fetch(`/api/holidays?year=${year}`),
        fetch('/api/employee/dashboard'),
      ])
      if (!attRes.ok) throw new Error('Failed to load attendance')
      setRecords(await attRes.json())
      if (leaveRes.ok) setLeaves(await leaveRes.json())
      if (holRes.ok) setHolidays(await holRes.json())
      if (dashRes.ok) {
        const dash = await dashRes.json()
        setJoiningDate(dash.employee?.joining_date ?? null)
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load attendance'))
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    load()
  }, [load])

  const holidayDates = useMemo(() => new Set(holidays.map((h) => dateKey(h.date))), [holidays])
  const attMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>()
    for (const r of records) map.set(dateKey(r.date), r)
    return map
  }, [records])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const pastDays =
    year === today.getFullYear() && month === today.getMonth() ? today.getDate() : daysInMonth

  const rows = useMemo(() => {
    const list: { date: string; record: AttendanceRecord | null; status: AttendanceStatus }[] = []
    for (let d = 1; d <= pastDays; d++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const record = attMap.get(date) ?? null
      const status = getAttendanceStatus({
        date,
        checkIn: record?.check_in,
        checkOut: record?.check_out,
        holidayDates,
        leaves,
        joiningDate,
      })
      if (status === 'WEEK_OFF' || status === 'HOLIDAY' || status === 'NOT_TRACKED') continue
      list.push({ date, record, status })
    }
    return list.reverse()
  }, [attMap, holidayDates, leaves, joiningDate, month, pastDays, year])

  const presentDays = rows.filter((r) => r.status === 'PRESENT').length
  const lateDays = rows.filter((r) => r.status === 'LATE').length
  const halfDays = rows.filter((r) => r.status === 'HALF_DAY').length
  const absentDays = rows.filter((r) => r.status === 'ABSENT').length
  const scored = presentDays + lateDays + halfDays + absentDays
  const attendanceRate =
    scored > 0 ? Math.round(((presentDays + lateDays + halfDays * 0.5) / scored) * 100) : 0

  const filtered =
    statusFilter === 'All Statuses' ? rows : rows.filter((r) => r.status === statusFilter)

  const formatTime = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Kolkata',
        })
      : '—'

  const formatDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  const stats = [
    { label: 'ATTENDANCE RATE', value: `${attendanceRate}%`, icon: TrendingUp, color: 'text-blue-600 bg-blue-100' },
    { label: 'PRESENT DAYS', value: presentDays + lateDays, icon: CheckCircle, color: 'text-green-600 bg-green-100' },
    { label: 'LATE ARRIVALS', value: lateDays, icon: AlertCircle, color: 'text-orange-600 bg-orange-100' },
    { label: 'ABSENT DAYS', value: absentDays, icon: XCircle, color: 'text-red-600 bg-red-100' },
  ]

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i)

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-accent-light px-6 py-4 text-center">
        <h1 className="text-xl font-semibold text-text-primary">
          Attendance <span className="text-accent">Tracker</span>
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{label}</p>
              <p className="text-xl font-bold text-text-primary">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-text-primary">Attendance History</h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          >
            <option>All Statuses</option>
            {ATTENDANCE_FILTER_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {ATTENDANCE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
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
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>DATE</TableHead>
              <TableHead>CHECK IN</TableHead>
              <TableHead>CHECK OUT</TableHead>
              <TableHead>WORKED HOURS</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>NOTES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-text-muted">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-text-muted">
                  No attendance records found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => {
                const ms = getWorkedMs(r.record?.check_in, r.record?.check_out)
                return (
                  <TableRow key={r.date}>
                    <TableCell className="font-medium">{formatDate(r.date)}</TableCell>
                    <TableCell className="font-medium text-green-600">{formatTime(r.record?.check_in ?? null)}</TableCell>
                    <TableCell className="font-medium text-red-600">{formatTime(r.record?.check_out ?? null)}</TableCell>
                    <TableCell>{formatWorkedHours(ms)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ATTENDANCE_STATUS_BADGE[r.status]}`}>
                        {ATTENDANCE_STATUS_LABELS[r.status]}
                      </span>
                    </TableCell>
                    <TableCell className="text-text-muted">{r.record?.notes || '-'}</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
