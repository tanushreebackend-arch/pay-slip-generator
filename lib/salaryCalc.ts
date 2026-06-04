export type SalaryCalculation = ReturnType<typeof calculateSalary>

export function calculateSalary(
  grossSalary: number,
  fromDate: string,
  toDate: string,
  lopDays: number,
  customDeductions: { label: string; amount: number }[]
) {
  const from = new Date(fromDate + 'T12:00:00')
  const to = new Date(toDate + 'T12:00:00')
  const year = from.getFullYear()
  const month = from.getMonth()
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate()

  const msPerDay = 1000 * 60 * 60 * 24
  const daysInRange = Math.floor((to.getTime() - from.getTime()) / msPerDay) + 1
  const effectivePaidDays = Math.max(0, daysInRange - lopDays)
  const ratio = totalDaysInMonth > 0 ? effectivePaidDays / totalDaysInMonth : 1

  const stdBasic = parseFloat((grossSalary * 0.5).toFixed(2))
  const stdHRA = parseFloat((stdBasic * 0.4).toFixed(2))
  const stdSpecial = parseFloat((grossSalary - stdBasic - stdHRA).toFixed(2))

  const actualBasic = parseFloat((stdBasic * ratio).toFixed(2))
  const actualHRA = parseFloat((stdHRA * ratio).toFixed(2))
  const actualSpecial = parseFloat((stdSpecial * ratio).toFixed(2))
  const actualGross = parseFloat((actualBasic + actualHRA + actualSpecial).toFixed(2))

  const pf = parseFloat((actualBasic * 0.12).toFixed(2))
  const customTotal = customDeductions.reduce(
    (sum, d) => sum + (parseFloat(String(d.amount)) || 0),
    0
  )
  const totalDeductions = parseFloat((pf + customTotal).toFixed(2))
  const netPay = parseFloat((actualGross - totalDeductions).toFixed(2))

  return {
    grossSalary,
    stdBasic,
    stdHRA,
    stdSpecial,
    actualBasic,
    actualHRA,
    actualSpecial,
    actualGross,
    pf,
    customDeductions,
    totalDeductions,
    netPay,
    effectivePaidDays,
    lopDays,
    totalDaysInMonth,
    daysInRange,
    fromDate,
    toDate,
  }
}
