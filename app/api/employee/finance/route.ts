import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireEmployee } from '@/lib/api-auth'
import { calculateMonthlyLeaveSummary } from '@/lib/leavePolicy'

export async function GET() {
  const { session, error } = await requireEmployee()
  if (error) return error

  const employeeId = session!.user.employeeId!

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } })
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

  const grossSalary = Number(employee.grossSalary)
  const annualCTC = grossSalary * 12

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  // Build payroll history for each month from January to current month
  const payrollHistory = []
  for (let m = 0; m <= currentMonth; m++) {
    const summary = calculateMonthlyLeaveSummary(
      grossSalary,
      leaveInputs,
      currentYear,
      m,
      employee.joiningDate,
      employee.createdAt,
    )
    payrollHistory.push({
      month: m,
      monthName: summary.monthName,
      year: summary.year,
      grossPay: summary.grossSalary,
      deductions: summary.leaveDeduction,
      netPay: summary.estimatedNetPay,
      status: m < currentMonth ? 'Paid' : 'Processing',
    })
  }

  const ytdEarnings = payrollHistory
    .filter((p) => p.status === 'Paid')
    .reduce((sum, p) => sum + p.netPay, 0)

  return NextResponse.json({
    annualCTC,
    monthlySalary: grossSalary,
    ytdEarnings: parseFloat(ytdEarnings.toFixed(2)),
    payrollHistory: payrollHistory.reverse(),
  })
}
