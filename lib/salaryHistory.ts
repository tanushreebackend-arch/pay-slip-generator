import { formatCalendarDate } from '@/lib/istDate'
import { countWorkingDaysInRange, isWorkingDay } from '@/lib/workingDays'

export type SalaryHistoryEntry = {
  monthlySalary: number
  annualCtc: number
  effectiveFrom: Date | string
}

export function monthlyFromAnnual(annualCtc: number): number {
  return parseFloat((annualCtc / 12).toFixed(2))
}

export function annualFromMonthly(monthly: number): number {
  return parseFloat((monthly * 12).toFixed(2))
}

/** Latest salary whose effectiveFrom is on or before the given calendar day. */
export function getSalaryOnDate(
  history: SalaryHistoryEntry[],
  dateStr: string,
  fallbackMonthly: number
): { monthlySalary: number; annualCtc: number } {
  const sorted = [...history].sort((a, b) => {
    const da = formatCalendarDate(a.effectiveFrom instanceof Date ? a.effectiveFrom : new Date(a.effectiveFrom + 'T12:00:00'))
    const db = formatCalendarDate(b.effectiveFrom instanceof Date ? b.effectiveFrom : new Date(b.effectiveFrom + 'T12:00:00'))
    return db.localeCompare(da)
  })

  for (const row of sorted) {
    const from =
      typeof row.effectiveFrom === 'string'
        ? row.effectiveFrom.slice(0, 10)
        : formatCalendarDate(row.effectiveFrom)
    if (from <= dateStr) {
      return { monthlySalary: Number(row.monthlySalary), annualCtc: Number(row.annualCtc) }
    }
  }

  return {
    monthlySalary: fallbackMonthly,
    annualCtc: annualFromMonthly(fallbackMonthly),
  }
}

export function getSalaryForMonth(
  history: SalaryHistoryEntry[],
  year: number,
  monthIndex: number,
  fallbackMonthly: number
): { monthlySalary: number; annualCtc: number } {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate()
  const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return getSalaryOnDate(history, dateStr, fallbackMonthly)
}

/** Prorate monthly pay when employee joins mid-month (by working days). */
export function prorateForJoiningMonth(
  monthlySalary: number,
  year: number,
  monthIndex: number,
  joiningDate: Date | null | undefined
): number {
  if (!joiningDate) return monthlySalary
  const joinY = joiningDate.getFullYear()
  const joinM = joiningDate.getMonth()
  if (joinY !== year || joinM !== monthIndex) return monthlySalary

  const monthStart = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, monthIndex + 1, 0).getDate()
  const monthEnd = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  const joinStr = formatCalendarDate(
    new Date(Date.UTC(joinY, joinM, joiningDate.getDate(), 12))
  )

  const fullWorking = countWorkingDaysInRange(monthStart, monthEnd)
  if (fullWorking <= 0) return monthlySalary

  // Count working days from joining date through month end
  let payable = 0
  const cursor = new Date(joinStr + 'T12:00:00')
  const end = new Date(monthEnd + 'T12:00:00')
  while (cursor <= end) {
    if (isWorkingDay(cursor)) payable++
    cursor.setDate(cursor.getDate() + 1)
  }

  return parseFloat(((monthlySalary * payable) / fullWorking).toFixed(2))
}
