'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/lib/utils'
import { LogIn, LogOut, Clock, Briefcase, Percent } from 'lucide-react'
import {
  ATTENDANCE_STATUS_BADGE,
  ATTENDANCE_STATUS_LABELS,
  dateKey,
  getAttendanceStatus,
  getWorkedMs,
  formatWorkedHours,
  isWeekend,
  type AttendanceStatus,
  type LeaveCover,
} from '@/lib/attendanceRules'
import { todayISTString } from '@/lib/istDate'

type PaySummary = {
  paidLeaveRemaining: number
}

type LeaveRow = LeaveCover & {
  id: string
  leave_type: string
}

type AttendanceDay = {
  date: string
  check_in: string
  check_out: string | null
}

type Holiday = { id: string; name: string; date: string }

type DashboardData = {
  employee?: { joining_date?: string }
  pay_summary: PaySummary
  today_attendance: {
    check_in: string
    check_out: string | null
  } | null
  pending_leave_count: number
  recent_leaves: LeaveRow[]
  all_leaves?: LeaveRow[]
  month_attendance?: AttendanceDay[]
  upcoming_holidays?: Holiday[]
  holidays?: Holiday[]
}

function formatTimeIST(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  })
}

function CircularProgress({ ms, maxMs }: { ms: number; maxMs: number }) {
  const pct = Math.min(1, ms / maxMs)
  const r = 70
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)

  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      <circle cx="90" cy="90" r={r} fill="none" stroke="#F0E6D6" strokeWidth="10" />
      <circle
        cx="90"
        cy="90"
        r={r}
        fill="none"
        stroke="#F5A623"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 90 90)"
        className="transition-all duration-500"
      />
      <text x="90" y="82" textAnchor="middle" fontSize="22" fontWeight="700">
        {formatWorkedHours(ms === 0 ? 0 : ms)}
      </text>
      <text x="90" y="105" textAnchor="middle" className="fill-text-muted" fontSize="11">
        Today&apos;s Work Time
      </text>
    </svg>
  )
}

type DayStatus = AttendanceStatus | 'none'

const calendarColors: Record<DayStatus, string> = {
  PRESENT: 'bg-green-500 text-white',
  LATE: 'bg-orange-500 text-white',
  HALF_DAY: 'bg-pink-500 text-white',
  ABSENT: 'bg-red-500 text-white',
  ON_LEAVE: 'bg-blue-500 text-white',
  WEEK_OFF: 'bg-indigo-400 text-white',
  HOLIDAY: 'bg-yellow-400 text-white',
  NOT_TRACKED: '',
  none: '',
}

const legendItems: { status: DayStatus; label: string }[] = [
  { status: 'PRESENT', label: 'Present' },
  { status: 'LATE', label: 'Late' },
  { status: 'HALF_DAY', label: 'Half Day' },
  { status: 'ABSENT', label: 'Absent' },
  { status: 'ON_LEAVE', label: 'On Leave' },
  { status: 'WEEK_OFF', label: 'Week Off' },
  { status: 'HOLIDAY', label: 'Holiday' },
]

export default function EmployeeDashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [now, setNow] = useState(Date.now())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const today = new Date()
      const y = today.getFullYear()
      const m = today.getMonth()
      const from = `${y}-${String(m + 1).padStart(2, '0')}-01`
      const lastDay = new Date(y, m + 1, 0).getDate()
      const to = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      const [dashRes, attRes] = await Promise.all([
        fetch('/api/employee/dashboard'),
        fetch(`/api/attendance?from=${from}&to=${to}`),
      ])
      if (!dashRes.ok) {
        const errBody = await dashRes.json().catch(() => ({}))
        throw new Error(errBody.error || 'Failed to load dashboard')
      }
      const dashData = await dashRes.json()
      const attData = attRes.ok ? await attRes.json() : []
      setData({ ...dashData, month_attendance: attData })
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load dashboard'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  const handleAction = async (action: 'check-in' | 'check-out') => {
    setActing(true)
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Action failed')
      // Update UI immediately from response, then refresh full dashboard
      if (result.check_in) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                today_attendance: {
                  check_in: result.check_in,
                  check_out: result.check_out ?? null,
                },
              }
            : prev
        )
      }
      toast.success(action === 'check-in' ? 'Checked in!' : 'Checked out!')
      await load()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Action failed'))
    } finally {
      setActing(false)
    }
  }

  const todayRecord = data?.today_attendance
  const workedMs = todayRecord
    ? todayRecord.check_out
      ? getWorkedMs(todayRecord.check_in, todayRecord.check_out)
      : Math.max(0, Date.now() - new Date(todayRecord.check_in).getTime())
    : 0
  void now

  const leaves = data?.all_leaves ?? data?.recent_leaves ?? []
  const holidayDates = useMemo(
    () => new Set((data?.holidays ?? []).map((h) => dateKey(h.date))),
    [data?.holidays]
  )

  const joiningDate = data?.employee?.joining_date ?? null

  const todayStr = todayISTString()
  const todayStatus = getAttendanceStatus({
    date: todayStr,
    checkIn: todayRecord?.check_in,
    checkOut: todayRecord?.check_out,
    holidayDates,
    leaves,
    joiningDate,
  })

  const calendarData = useMemo(() => {
    const today = new Date()
    const y = today.getFullYear()
    const m = today.getMonth()
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const firstDow = new Date(y, m, 1).getDay()
    const todayDay = Number(todayISTString().slice(8, 10))
    const todayMonth = Number(todayISTString().slice(5, 7)) - 1
    const todayYear = Number(todayISTString().slice(0, 4))

    const attMap = new Map<number, AttendanceDay>()
    for (const a of data?.month_attendance ?? []) {
      const d = Number(dateKey(a.date).slice(8, 10))
      attMap.set(d, a)
    }

    const days: { day: number; status: DayStatus }[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const isFuture =
        y > todayYear || (y === todayYear && m > todayMonth) || (y === todayYear && m === todayMonth && d > todayDay)
      if (isFuture && !holidayDates.has(date) && !isWeekend(date)) {
        days.push({ day: d, status: 'none' })
        continue
      }
      const att = attMap.get(d)
      const status = getAttendanceStatus({
        date,
        checkIn: att?.check_in,
        checkOut: att?.check_out,
        holidayDates,
        leaves,
        joiningDate,
      })
      days.push({
        day: d,
        status: status === 'NOT_TRACKED' ? 'none' : status,
      })
    }

    return { firstDow, days }
  }, [data?.month_attendance, holidayDates, leaves, joiningDate])

  const attendanceRate = useMemo(() => {
    let scored = 0
    let presentish = 0
    for (const { status } of calendarData.days) {
      if (status === 'HOLIDAY' || status === 'WEEK_OFF' || status === 'none' || status === 'NOT_TRACKED') continue
      scored += 1
      if (status === 'PRESENT' || status === 'LATE') presentish += 1
      if (status === 'HALF_DAY') presentish += 0.5
    }
    return scored > 0 ? Math.round((presentish / scored) * 100) : 0
  }, [calendarData])

  const upcoming = data?.upcoming_holidays ?? []

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-text-primary">
          Welcome back, <span className="text-accent">{session?.user?.name || 'User'}</span>
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Here is what&apos;s happening in your organization today.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-text-muted">Loading...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                <Briefcase className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Leave Balance</p>
                <p className="text-lg font-bold text-text-primary">
                  {data?.pay_summary.paidLeaveRemaining ?? 0} Days
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Percent className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-text-muted">My Attendance</p>
                <p className="text-lg font-bold text-text-primary">{attendanceRate}%</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <LogIn className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Check In</p>
                <p className="text-lg font-bold text-text-primary">
                  {todayRecord?.check_in ? formatTimeIST(todayRecord.check_in) : '--:--'}
                </p>
                <p className="text-[10px] text-text-muted">IST · Office 9:00 AM</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                <LogOut className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Check Out</p>
                <p className="text-lg font-bold text-text-primary">
                  {todayRecord?.check_out ? formatTimeIST(todayRecord.check_out) : '--:--'}
                </p>
                <p className="text-[10px] text-text-muted">IST · Office 6:00 PM</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-text-muted">Working Hours</p>
                  <p className="text-lg font-bold text-text-primary">{formatWorkedHours(workedMs)}</p>
                </div>
              </div>
              {!todayRecord ? (
                <Button
                  onClick={() => handleAction('check-in')}
                  disabled={acting}
                  className="bg-accent text-white hover:bg-accent-hover"
                >
                  Check In
                </Button>
              ) : !todayRecord.check_out ? (
                <Button
                  onClick={() => handleAction('check-out')}
                  disabled={acting}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  Check Out
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-background p-6">
              <h2 className="mb-4 text-base font-semibold text-text-primary">My Attendance</h2>
              <div className="flex items-center gap-8">
                <CircularProgress ms={workedMs} maxMs={9 * 3600000} />
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-8">
                    <span className="text-text-secondary">Check In</span>
                    <span className="font-medium">
                      {todayRecord?.check_in ? formatTimeIST(todayRecord.check_in) : '--:--'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <span className="text-text-secondary">Check Out</span>
                    <span className="font-medium">
                      {todayRecord?.check_out ? formatTimeIST(todayRecord.check_out) : '--:--'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <span className="text-text-secondary">Working Hours</span>
                    <span className="font-medium">{todayRecord ? formatWorkedHours(workedMs) : '--'}</span>
                  </div>
                  <div className="pt-2">
                    <p className="text-xs font-medium text-text-muted">Status</p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ATTENDANCE_STATUS_BADGE[todayStatus]}`}
                    >
                      {ATTENDANCE_STATUS_LABELS[todayStatus]}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-6">
              <h2 className="mb-4 text-base font-semibold text-text-primary">Attendance Report</h2>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="py-1 font-medium text-text-muted">
                    {d}
                  </div>
                ))}
                {Array.from({ length: calendarData.firstDow }, (_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {calendarData.days.map(({ day, status }) => (
                  <div
                    key={day}
                    className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                      status === 'none' ? 'text-text-muted' : calendarColors[status]
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-[11px]">
                {legendItems.map(({ status, label }) => (
                  <div key={status} className="flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${calendarColors[status].split(' ')[0]}`} />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-6">
            <h2 className="mb-4 text-base font-semibold text-text-primary">Holidays & Events</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-text-muted">No upcoming holidays this year.</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((h) => {
                  const d = new Date(h.date + 'T12:00:00')
                  const month = d.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()
                  return (
                    <li key={h.id} className="flex items-center gap-3 rounded-lg px-1 py-1.5">
                      <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                        <span className="text-[10px] font-semibold leading-none">{month}</span>
                        <span className="text-lg font-bold leading-tight">{d.getDate()}</span>
                      </div>
                      <p className="text-sm font-medium text-text-primary">{h.name}</p>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
