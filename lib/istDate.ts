/** Asia/Kolkata calendar helpers — avoid UTC/local midnight mismatches with @db.Date */

const IST = 'Asia/Kolkata'

export function istDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const day = Number(parts.find((p) => p.type === 'day')?.value)
  return { year, month, day }
}

/** YYYY-MM-DD for "today" in IST */
export function todayISTString(date = new Date()): string {
  const { year, month, day } = istDateParts(date)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * Store calendar dates at noon UTC so @db.Date stays on the intended day
 * regardless of server timezone.
 */
export function calendarDateUTC(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00.000Z`)
}

export function todayCalendarDateUTC(date = new Date()): Date {
  return calendarDateUTC(todayISTString(date))
}

export function formatCalendarDate(date: Date): string {
  // DATE columns from Prisma are usually midnight UTC for that calendar day
  return date.toISOString().split('T')[0]
}

export function monthBoundsIST(year: number, monthIndex: number) {
  const from = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  const to = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return {
    from,
    to,
    fromDate: calendarDateUTC(from),
    toDate: calendarDateUTC(to),
  }
}
