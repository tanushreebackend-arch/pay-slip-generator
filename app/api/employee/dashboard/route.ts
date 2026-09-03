import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireEmployee } from '@/lib/api-auth'
import { mapEmployee } from '@/lib/mappers'
import { calculateMonthlyLeaveSummary } from '@/lib/leavePolicy'
import {
  calendarDateUTC,
  formatCalendarDate,
  istDateParts,
  todayCalendarDateUTC,
  todayISTString,
} from '@/lib/istDate'

function formatLeave(row: {
  id: string
  leaveType: string
  fromDate: Date
  toDate: Date
  days: { toString(): string }
  reason: string | null
  status: string
  adminNote: string | null
  reviewedAt: Date | null
  createdAt: Date
}) {
  return {
    id: row.id,
    leave_type: row.leaveType,
    from_date: formatCalendarDate(row.fromDate),
    to_date: formatCalendarDate(row.toDate),
    days: Number(row.days),
    reason: row.reason,
    status: row.status,
    admin_note: row.adminNote,
    reviewed_at: row.reviewedAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString(),
  }
}

/** Find today's attendance using IST calendar day (handles legacy timezone-shifted rows). */
async function findTodayAttendance(employeeId: string) {
  const todayStr = todayISTString()
  const today = todayCalendarDateUTC()

  const direct = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  })
  if (direct) return direct

  const { year, month, day } = istDateParts()
  const prevUtc = new Date(Date.UTC(year, month - 1, day - 1, 12, 0, 0))
  const prev = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date: prevUtc } },
  })
  if (prev && todayISTString(prev.checkIn) === todayStr) return prev

  return null
}

export async function GET() {
  try {
    const { session, error } = await requireEmployee()
    if (error) return error

    const employeeId = session!.user.employeeId!
    const todayStr = todayISTString()
    const { year } = istDateParts()
    const yearStart = calendarDateUTC(`${year}-01-01`)
    const yearEnd = calendarDateUTC(`${year}-12-31`)

    const holidayQuery =
      typeof prisma.publicHoliday?.findMany === 'function'
        ? prisma.publicHoliday.findMany({
            where: { date: { gte: yearStart, lte: yearEnd } },
            orderBy: { date: 'asc' },
          })
        : Promise.resolve([])

    const [employee, leaves, todayAttendance, holidays] = await Promise.all([
      prisma.employee.findUnique({ where: { id: employeeId } }),
      prisma.leaveRequest.findMany({
        where: { employeeId },
        orderBy: { createdAt: 'desc' },
      }),
      findTodayAttendance(employeeId),
      holidayQuery.catch(() => []),
    ])

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const leaveInputs = leaves.map((l) => ({
      fromDate: l.fromDate,
      toDate: l.toDate,
      days: Number(l.days),
      status: l.status,
    }))

    const paySummary = calculateMonthlyLeaveSummary(
      Number(employee.grossSalary),
      leaveInputs,
      undefined,
      undefined,
      employee.joiningDate,
      employee.createdAt
    )

    const pendingLeaves = leaves.filter((l) => l.status === 'PENDING')
    const recentLeaves = leaves.slice(0, 5).map(formatLeave)
    const holidayRows = holidays.map((h) => ({
      id: h.id,
      name: h.name,
      date: formatCalendarDate(h.date),
    }))

    return NextResponse.json({
      employee: mapEmployee(employee),
      pay_summary: paySummary,
      today_attendance: todayAttendance
        ? {
            id: todayAttendance.id,
            date: formatCalendarDate(todayAttendance.date),
            check_in: todayAttendance.checkIn.toISOString(),
            check_out: todayAttendance.checkOut?.toISOString() ?? null,
          }
        : null,
      pending_leave_count: pendingLeaves.length,
      recent_leaves: recentLeaves,
      all_leaves: leaves.map(formatLeave),
      upcoming_holidays: holidayRows.filter((h) => h.date >= todayStr),
      holidays: holidayRows,
    })
  } catch (err: unknown) {
    console.error('employee dashboard error', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load dashboard' },
      { status: 500 }
    )
  }
}
