import { isWorkingDay } from '@/lib/workingDays'

export const OFFICE_START_HOUR = 9
export const OFFICE_END_HOUR = 18
export const LATE_AFTER_HOUR = 10
export const LATE_AFTER_MINUTE = 30
export const HALF_DAY_AFTER_HOUR = 12
export const MIN_FULL_DAY_MS = 4.5 * 60 * 60 * 1000

/** Days before this are not marked Absent (portal launched; employees weren't using it yet). */
export const ATTENDANCE_TRACKING_START = '2026-09-04'

export type AttendanceStatus =
  | 'PRESENT'
  | 'LATE'
  | 'HALF_DAY'
  | 'ABSENT'
  | 'ON_LEAVE'
  | 'HOLIDAY'
  | 'WEEK_OFF'
  | 'NOT_TRACKED'

export type LeaveCover = {
  from_date: string
  to_date: string
  days: number
  status: string
}

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: 'Present',
  LATE: 'Late',
  HALF_DAY: 'Half Day',
  ABSENT: 'Absent',
  ON_LEAVE: 'On Leave',
  HOLIDAY: 'Holiday',
  WEEK_OFF: 'Week Off',
  NOT_TRACKED: '—',
}

export const ATTENDANCE_STATUS_BADGE: Record<AttendanceStatus, string> = {
  PRESENT: 'bg-green-100 text-green-700',
  LATE: 'bg-orange-100 text-orange-700',
  HALF_DAY: 'bg-yellow-100 text-yellow-700',
  ABSENT: 'bg-red-100 text-red-700',
  ON_LEAVE: 'bg-blue-100 text-blue-700',
  HOLIDAY: 'bg-yellow-100 text-yellow-800',
  WEEK_OFF: 'bg-indigo-100 text-indigo-700',
  NOT_TRACKED: 'bg-gray-100 text-gray-500',
}

export const ATTENDANCE_FILTER_OPTIONS: AttendanceStatus[] = [
  'PRESENT',
  'LATE',
  'HALF_DAY',
  'ABSENT',
  'ON_LEAVE',
]

export function dateKey(date: Date | string): string {
  if (typeof date === 'string') return date.slice(0, 10)
  return date.toISOString().split('T')[0]
}

function getISTMinutes(iso: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso))
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return hour * 60 + minute
}

/** Week off: every Sunday + 2nd & 4th Saturday only (1st/3rd/5th Sat are working). */
export function isWeekend(dateStr: string): boolean {
  return !isWorkingDay(new Date(dateStr + 'T12:00:00'))
}

/** Attendance is scored only from portal go-live and on/after joining date. */
export function isAttendanceTracked(dateStr: string, joiningDate?: string | null): boolean {
  if (dateStr < ATTENDANCE_TRACKING_START) return false
  if (joiningDate) {
    const join = dateKey(joiningDate)
    if (dateStr < join) return false
  }
  return true
}

export function leaveOnDate(
  dateStr: string,
  leaves: LeaveCover[]
): { onLeave: boolean; halfDay: boolean } {
  for (const leave of leaves) {
    if (leave.status !== 'APPROVED') continue
    if (dateStr >= leave.from_date && dateStr <= leave.to_date) {
      return { onLeave: true, halfDay: Number(leave.days) === 0.5 }
    }
  }
  return { onLeave: false, halfDay: false }
}

export function getWorkedMs(checkIn: string | null | undefined, checkOut: string | null | undefined): number {
  if (!checkIn || !checkOut) return 0
  return Math.max(0, new Date(checkOut).getTime() - new Date(checkIn).getTime())
}

export function formatWorkedHours(ms: number): string {
  if (ms === 0) return '--'
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

export function getAttendanceStatus(opts: {
  date: string
  checkIn?: string | null
  checkOut?: string | null
  holidayDates: Set<string> | string[]
  leaves: LeaveCover[]
  joiningDate?: string | null
}): AttendanceStatus {
  const holidays =
    opts.holidayDates instanceof Set ? opts.holidayDates : new Set(opts.holidayDates)

  // Before joining / before portal launch: never mark Absent (unless they checked in)
  if (!isAttendanceTracked(opts.date, opts.joiningDate)) {
    if (!opts.checkIn) return 'NOT_TRACKED'
  }

  if (holidays.has(opts.date)) return 'HOLIDAY'
  if (isWeekend(opts.date)) return 'WEEK_OFF'

  const leave = leaveOnDate(opts.date, opts.leaves)
  if (leave.onLeave && leave.halfDay) return 'HALF_DAY'
  if (leave.onLeave) return 'ON_LEAVE'
  if (!opts.checkIn) return 'ABSENT'

  const checkInMins = getISTMinutes(opts.checkIn)
  const lateAfter = LATE_AFTER_HOUR * 60 + LATE_AFTER_MINUTE
  const halfAfter = HALF_DAY_AFTER_HOUR * 60
  const durationHalf = opts.checkOut ? getWorkedMs(opts.checkIn, opts.checkOut) < MIN_FULL_DAY_MS : false

  if (checkInMins >= halfAfter || durationHalf) return 'HALF_DAY'
  if (checkInMins > lateAfter) return 'LATE'
  return 'PRESENT'
}

export function holidaySet(holidays: { date: string }[]): Set<string> {
  return new Set(holidays.map((h) => dateKey(h.date)))
}
