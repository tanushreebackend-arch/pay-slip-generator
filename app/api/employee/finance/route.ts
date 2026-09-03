import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireEmployee } from '@/lib/api-auth'
import { calculateMonthlyLeaveSummary } from '@/lib/leavePolicy'
import { formatCalendarDate, istDateParts } from '@/lib/istDate'
import {
  getSalaryForMonth,
  prorateForJoiningMonth,
  type SalaryHistoryEntry,
} from '@/lib/salaryHistory'

export async function GET() {
  const { session, error } = await requireEmployee()
  if (error) return error

  const employeeId = session!.user.employeeId!

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { salaryHistory: { orderBy: { effectiveFrom: 'desc' } } },
  })
  if (!employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  }

  const leaves = await prisma.leaveRequest.findMany({
    where: { employeeId },
    orderBy: { createdAt: 'desc' },
  })

  const leaveInputs = leaves.map((l) => ({
    fromDate: l.fromDate,
    toDate: l.toDate,
    days: Number(l.days),
    status: l.status,
  }))

  const currentGross = Number(employee.grossSalary)
  const history: SalaryHistoryEntry[] = employee.salaryHistory.map((h) => ({
    monthlySalary: Number(h.monthlySalary),
    annualCtc: Number(h.annualCtc),
    effectiveFrom: h.effectiveFrom,
  }))

  // If no history yet, treat current gross as effective from joining (or created)
  if (history.length === 0) {
    history.push({
      monthlySalary: currentGross,
      annualCtc: currentGross * 12,
      effectiveFrom: employee.joiningDate ?? employee.createdAt,
    })
  }

  const { year: currentYear, month: currentMonthIndex } = (() => {
    const p = istDateParts()
    return { year: p.year, month: p.month - 1 }
  })()

  const join = employee.joiningDate
  let startYear = join ? join.getUTCFullYear() : currentYear
  let startMonth = join ? join.getUTCMonth() : 0
  // Prefer local calendar components from ISO date string to avoid TZ shift
  if (join) {
    const joinStr = formatCalendarDate(join)
    startYear = Number(joinStr.slice(0, 4))
    startMonth = Number(joinStr.slice(5, 7)) - 1
  }

  const payrollHistory = []
  let y = startYear
  let m = startMonth
  while (y < currentYear || (y === currentYear && m <= currentMonthIndex)) {
    const { monthlySalary } = getSalaryForMonth(history, y, m, currentGross)
    const grossForMonth = prorateForJoiningMonth(monthlySalary, y, m, join)

    const summary = calculateMonthlyLeaveSummary(
      grossForMonth,
      leaveInputs,
      y,
      m,
      employee.joiningDate,
      employee.createdAt
    )

    payrollHistory.push({
      month: m,
      monthName: summary.monthName,
      year: y,
      grossPay: grossForMonth,
      deductions: summary.leaveDeduction,
      netPay: summary.estimatedNetPay,
      status: y < currentYear || m < currentMonthIndex ? 'Paid' : 'Processing',
    })

    m += 1
    if (m > 11) {
      m = 0
      y += 1
    }
  }

  const current = getSalaryForMonth(history, currentYear, currentMonthIndex, currentGross)
  const ytdEarnings = payrollHistory
    .filter((p) => p.status === 'Paid')
    .reduce((sum, p) => sum + p.netPay, 0)

  return NextResponse.json({
    annualCTC: current.annualCtc,
    monthlySalary: current.monthlySalary,
    ytdEarnings: parseFloat(ytdEarnings.toFixed(2)),
    payrollHistory: payrollHistory.reverse(),
    joining_date: join ? formatCalendarDate(join) : null,
  })
}
