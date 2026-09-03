import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/api-auth'
import { calendarDateUTC, formatCalendarDate } from '@/lib/istDate'

function formatHoliday(row: { id: string; name: string; date: Date }) {
  return {
    id: row.id,
    name: row.name,
    date: formatCalendarDate(row.date),
  }
}

export async function GET(request: Request) {
  const { error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const yearParam = searchParams.get('year')
  const year = yearParam ? Number(yearParam) : new Date().getFullYear()
  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
  }

  const from = calendarDateUTC(`${year}-01-01`)
  const to = calendarDateUTC(`${year}-12-31`)

  if (typeof prisma.publicHoliday?.findMany !== 'function') {
    return NextResponse.json([])
  }

  const rows = await prisma.publicHoliday.findMany({
    where: { date: { gte: from, lte: to } },
    orderBy: { date: 'asc' },
  })

  return NextResponse.json(rows.map(formatHoliday))
}

export async function POST(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const name = String(body.name || '').trim()
  const dateStr = String(body.date || '')
  if (!name || !dateStr) {
    return NextResponse.json({ error: 'Name and date are required' }, { status: 400 })
  }

  const date = calendarDateUTC(dateStr)
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  if (typeof prisma.publicHoliday?.create !== 'function') {
    return NextResponse.json(
      { error: 'Holiday model not ready. Restart the server after prisma generate.' },
      { status: 503 }
    )
  }

  try {
    const row = await prisma.publicHoliday.create({
      data: { name, date },
    })
    return NextResponse.json(formatHoliday(row), { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add holiday'
    if (message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'A holiday already exists on this date' }, { status: 409 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Holiday id is required' }, { status: 400 })
  }

  await prisma.publicHoliday.delete({ where: { id } }).catch(() => null)
  return NextResponse.json({ ok: true })
}
