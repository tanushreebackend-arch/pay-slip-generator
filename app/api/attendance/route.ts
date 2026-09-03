import { NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { calendarDateUTC, formatCalendarDate, istDateParts, todayCalendarDateUTC, todayISTString } from '@/lib/istDate'

function formatRecord(row: {
  id: string
  date: Date
  checkIn: Date
  checkOut: Date | null
  notes: string | null
  employee: { id: string; name: string; employeeId: string }
}) {
  return {
    id: row.id,
    date: formatCalendarDate(row.date),
    check_in: row.checkIn.toISOString(),
    check_out: row.checkOut?.toISOString() ?? null,
    notes: row.notes,
    employee: {
      id: row.employee.id,
      name: row.employee.name,
      employee_id: row.employee.employeeId,
    },
  }
}

async function findTodayAttendance(employeeId: string) {
  const todayStr = todayISTString()
  const today = todayCalendarDateUTC()

  const direct = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
    include: { employee: true },
  })
  if (direct) return direct

  const { year, month, day } = istDateParts()
  const prevUtc = new Date(Date.UTC(year, month - 1, day - 1, 12, 0, 0))
  const prev = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date: prevUtc } },
    include: { employee: true },
  })
  if (prev && todayISTString(prev.checkIn) === todayStr) return prev

  return null
}

export async function GET(request: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const employeeIdParam = searchParams.get('employee_id')

  let where: { employeeId?: string } = {}

  if (session!.user.role === UserRole.ADMIN) {
    if (employeeIdParam) {
      where = { employeeId: employeeIdParam }
    }
  } else {
    where = { employeeId: session!.user.employeeId! }
  }

  const dateFilter: { gte?: Date; lte?: Date } = {}
  if (from) dateFilter.gte = calendarDateUTC(from)
  if (to) dateFilter.lte = calendarDateUTC(to)

  const rows = await prisma.attendanceRecord.findMany({
    where: {
      ...where,
      ...(Object.keys(dateFilter).length ? { date: dateFilter } : {}),
    },
    include: { employee: true },
    orderBy: [{ date: 'desc' }, { checkIn: 'desc' }],
  })

  return NextResponse.json(rows.map(formatRecord))
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const body = await request.json()

  if (session!.user.role === UserRole.ADMIN) {
    const employeeId = String(body.employee_id || '')
    const dateStr = String(body.date || '')
    const checkInRaw = String(body.check_in || '')
    if (!employeeId || !dateStr || !checkInRaw) {
      return NextResponse.json(
        { error: 'Employee, date, and check-in time are required' },
        { status: 400 }
      )
    }

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } })
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const date = calendarDateUTC(dateStr)
    const checkIn = new Date(checkInRaw)
    const checkOut = body.check_out ? new Date(String(body.check_out)) : null
    if (Number.isNaN(checkIn.getTime()) || (checkOut && Number.isNaN(checkOut.getTime()))) {
      return NextResponse.json({ error: 'Invalid check-in or check-out time' }, { status: 400 })
    }

    const row = await prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId, date } },
      create: { employeeId, date, checkIn, checkOut, notes: body.notes || null },
      update: { checkIn, checkOut, notes: body.notes || null },
      include: { employee: true },
    })
    return NextResponse.json(formatRecord(row), { status: 201 })
  }

  const action = body.action as 'check-in' | 'check-out'

  if (session!.user.role !== UserRole.EMPLOYEE || !session!.user.employeeId) {
    return NextResponse.json({ error: 'Only employees can check in/out' }, { status: 403 })
  }

  // Employees may clock in/out at any hour (including late evening).
  const employeeId = session!.user.employeeId
  const today = todayCalendarDateUTC()
  const now = new Date()

  if (action === 'check-in') {
    const existing = await findTodayAttendance(employeeId)
    // Idempotent: if already checked in, return the record so the UI can sync
    if (existing) {
      return NextResponse.json(formatRecord(existing))
    }

    try {
      const row = await prisma.attendanceRecord.create({
        data: { employeeId, date: today, checkIn: now },
        include: { employee: true },
      })
      return NextResponse.json(formatRecord(row), { status: 201 })
    } catch (err: unknown) {
      // Race / unique conflict: return existing row instead of erroring
      const again = await findTodayAttendance(employeeId)
      if (again) return NextResponse.json(formatRecord(again))
      const message = err instanceof Error ? err.message : 'Check-in failed'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  if (action === 'check-out') {
    const existing = await findTodayAttendance(employeeId)
    if (!existing) {
      return NextResponse.json({ error: 'Check in first before checking out' }, { status: 400 })
    }
    if (existing.checkOut) {
      return NextResponse.json(formatRecord(existing))
    }

    const row = await prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { checkOut: now },
      include: { employee: true },
    })
    return NextResponse.json(formatRecord(row))
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function PATCH(request: Request) {
  const { session, error } = await requireAuth()
  if (error) return error
  if (session!.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const id = String(body.id || '')
  if (!id) {
    return NextResponse.json({ error: 'Record id is required' }, { status: 400 })
  }

  const existing = await prisma.attendanceRecord.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 })
  }

  const checkIn = body.check_in ? new Date(String(body.check_in)) : existing.checkIn
  const checkOut =
    body.check_out === null || body.check_out === ''
      ? null
      : body.check_out
        ? new Date(String(body.check_out))
        : existing.checkOut

  if (Number.isNaN(checkIn.getTime()) || (checkOut && Number.isNaN(checkOut.getTime()))) {
    return NextResponse.json({ error: 'Invalid check-in or check-out time' }, { status: 400 })
  }

  const row = await prisma.attendanceRecord.update({
    where: { id },
    data: { checkIn, checkOut },
    include: { employee: true },
  })
  return NextResponse.json(formatRecord(row))
}

export async function DELETE(request: Request) {
  const { session, error } = await requireAuth()
  if (error) return error
  if (session!.user.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Record id is required' }, { status: 400 })
  }

  await prisma.attendanceRecord.delete({ where: { id } }).catch(() => null)
  return NextResponse.json({ ok: true })
}
