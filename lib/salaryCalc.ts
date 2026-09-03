export const PROFESSIONAL_TAX = 200
/** Indian payroll month is treated as a 30-day cycle, not office working days. */
export const PAY_CYCLE_DAYS = 30

const MEDICAL_RATIO = 1250 / 52000
const CONVEYANCE_RATIO = 1600 / 52000

export function getDefaultBasic(grossSalary: number): number {
  return parseFloat((grossSalary * 0.5).toFixed(2))
}

export function getDefaultHra(grossSalary: number, basic?: number | null): number {
  const stdBasic =
    basic != null && !Number.isNaN(basic) ? parseFloat(Number(basic).toFixed(2)) : getDefaultBasic(grossSalary)
  return parseFloat((stdBasic * 0.4).toFixed(2))
}

export function getDefaultMedicalAllowance(grossSalary: number): number {
  return parseFloat((grossSalary * MEDICAL_RATIO).toFixed(2))
}

export function getDefaultConveyanceAllowance(grossSalary: number): number {
  return parseFloat((grossSalary * CONVEYANCE_RATIO).toFixed(2))
}

export function getDefaultSpecialAllowance(
  grossSalary: number,
  medicalAllowance?: number | null,
  conveyanceAllowance?: number | null,
  basic?: number | null,
  hra?: number | null
): number {
  const stdBasic =
    basic != null && !Number.isNaN(basic) ? parseFloat(Number(basic).toFixed(2)) : getDefaultBasic(grossSalary)
  const stdHRA =
    hra != null && !Number.isNaN(hra) ? parseFloat(Number(hra).toFixed(2)) : getDefaultHra(grossSalary, stdBasic)
  const medical =
    medicalAllowance != null && !Number.isNaN(medicalAllowance)
      ? parseFloat(Number(medicalAllowance).toFixed(2))
      : getDefaultMedicalAllowance(grossSalary)
  const conveyance =
    conveyanceAllowance != null && !Number.isNaN(conveyanceAllowance)
      ? parseFloat(Number(conveyanceAllowance).toFixed(2))
      : getDefaultConveyanceAllowance(grossSalary)
  return parseFloat((grossSalary - stdBasic - stdHRA - medical - conveyance).toFixed(2))
}

export function getDefaultPfAmount(grossSalary: number): number {
  return parseFloat((grossSalary * 0.5 * 0.12).toFixed(2))
}

function inclusiveCalendarDays(fromDate: string, toDate: string): number {
  const from = new Date(fromDate + 'T12:00:00')
  const to = new Date(toDate + 'T12:00:00')
  if (to < from) return 0
  return Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1
}

function isFullCalendarMonth(fromDate: string, toDate: string): boolean {
  const from = new Date(fromDate + 'T12:00:00')
  const to = new Date(toDate + 'T12:00:00')
  if (from.getFullYear() !== to.getFullYear() || from.getMonth() !== to.getMonth()) {
    return false
  }
  const lastDay = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate()
  return from.getDate() === 1 && to.getDate() === lastDay
}

/** Days credited in the 30-day cycle for this from/to range (before LOP). */
export function getPayCycleDaysInPeriod(fromDate: string, toDate: string): number {
  if (isFullCalendarMonth(fromDate, toDate)) return PAY_CYCLE_DAYS
  return Math.min(inclusiveCalendarDays(fromDate, toDate), PAY_CYCLE_DAYS)
}

export type SalaryLineItem = { label: string; amount: number }

export type SalaryCalculationOptions = {
  finalSettlement?: number
  reimbursements?: SalaryLineItem[]
  /** Extra earning lines (e.g. Gift Allowance) — label + amount */
  extraAllowances?: SalaryLineItem[]
  basic?: number | null
  hra?: number | null
  /** Override standard medical allowance (monthly gross component) */
  medicalAllowance?: number | null
  /** Override standard conveyance / convenience allowance (monthly) */
  conveyanceAllowance?: number | null
  /** Override standard special allowance (monthly) */
  specialAllowance?: number | null
  /** Override PF employee deduction (fixed amount instead of 12% of basic) */
  pfAmount?: number | null
}

export type SalaryCalculation = ReturnType<typeof calculateSalary>

export function calculateSalary(
  grossSalary: number,
  fromDate: string,
  toDate: string,
  lopDays: number,
  customDeductions: SalaryLineItem[],
  options: SalaryCalculationOptions = {}
) {
  const from = new Date(fromDate + 'T12:00:00')
  const year = from.getFullYear()
  const month = from.getMonth()
  const calendarDaysInMonth = new Date(year, month + 1, 0).getDate()

  const daysInPeriod = getPayCycleDaysInPeriod(fromDate, toDate)
  const totalWorkingDays = PAY_CYCLE_DAYS
  const effectivePaidDays = parseFloat(Math.max(0, daysInPeriod - lopDays).toFixed(1))
  const ratio = PAY_CYCLE_DAYS > 0 ? effectivePaidDays / PAY_CYCLE_DAYS : 1

  const stdBasic =
    options.basic != null && !Number.isNaN(options.basic)
      ? parseFloat(Number(options.basic).toFixed(2))
      : getDefaultBasic(grossSalary)
  const stdHRA =
    options.hra != null && !Number.isNaN(options.hra)
      ? parseFloat(Number(options.hra).toFixed(2))
      : getDefaultHra(grossSalary, stdBasic)
  const stdMedical =
    options.medicalAllowance != null && !Number.isNaN(options.medicalAllowance)
      ? parseFloat(Number(options.medicalAllowance).toFixed(2))
      : getDefaultMedicalAllowance(grossSalary)
  const stdConveyance =
    options.conveyanceAllowance != null && !Number.isNaN(options.conveyanceAllowance)
      ? parseFloat(Number(options.conveyanceAllowance).toFixed(2))
      : getDefaultConveyanceAllowance(grossSalary)
  const stdSpecial =
    options.specialAllowance != null && !Number.isNaN(options.specialAllowance)
      ? parseFloat(Number(options.specialAllowance).toFixed(2))
      : getDefaultSpecialAllowance(grossSalary, stdMedical, stdConveyance, stdBasic, stdHRA)

  const actualBasic = parseFloat((stdBasic * ratio).toFixed(2))
  const actualHRA = parseFloat((stdHRA * ratio).toFixed(2))
  const actualMedical = parseFloat((stdMedical * ratio).toFixed(2))
  const actualConveyance = parseFloat((stdConveyance * ratio).toFixed(2))
  const actualSpecial = parseFloat((stdSpecial * ratio).toFixed(2))
  const finalSettlement = parseFloat(String(options.finalSettlement ?? 0)) || 0

  const extraAllowancesMonthly = (options.extraAllowances ?? [])
    .filter((a) => a.label)
    .map((a) => ({
      label: a.label,
      amount: parseFloat(String(a.amount)) || 0,
    }))
  const extraAllowances = extraAllowancesMonthly.map((a) => ({
    label: a.label,
    amount: parseFloat((a.amount * ratio).toFixed(2)),
  }))
  const totalExtraAllowances = parseFloat(
    extraAllowances.reduce((sum, a) => sum + a.amount, 0).toFixed(2)
  )

  const salaryEarnings =
    actualBasic + actualHRA + actualMedical + actualConveyance + actualSpecial + totalExtraAllowances
  const totalEarningsA = parseFloat((salaryEarnings + finalSettlement).toFixed(2))

  const pfEmployee =
    options.pfAmount != null && !Number.isNaN(options.pfAmount)
      ? parseFloat((Number(options.pfAmount) * ratio).toFixed(2))
      : parseFloat((actualBasic * 0.12).toFixed(2))
  const totalPfDeductionsB = pfEmployee

  const professionalTax = PROFESSIONAL_TAX
  const otherTaxDeductions = customDeductions
    .filter((d) => d.label)
    .map((d) => ({ label: d.label, amount: parseFloat(String(d.amount)) || 0 }))
  const otherTaxTotal = parseFloat(
    otherTaxDeductions.reduce((sum, d) => sum + d.amount, 0).toFixed(2)
  )
  const totalTaxesDeductionsC = parseFloat((professionalTax + otherTaxTotal).toFixed(2))

  const reimbursements = (options.reimbursements ?? [])
    .filter((r) => r.label)
    .map((r) => ({ label: r.label, amount: parseFloat(String(r.amount)) || 0 }))
  const totalReimbursementsD = parseFloat(
    reimbursements.reduce((sum, r) => sum + r.amount, 0).toFixed(2)
  )

  const pfEmployer = pfEmployee
  const pfOtherCharges = parseFloat((pfEmployee / 12).toFixed(2))
  const totalOtherComponentsE = parseFloat((pfEmployer + pfOtherCharges).toFixed(2))

  const totalDeductions = parseFloat((totalPfDeductionsB + totalTaxesDeductionsC).toFixed(2))
  const netPay = parseFloat(
    (totalEarningsA - totalPfDeductionsB - totalTaxesDeductionsC + totalReimbursementsD).toFixed(2)
  )
  const totalCost = parseFloat((totalEarningsA + totalOtherComponentsE).toFixed(2))

  return {
    grossSalary,
    stdBasic,
    stdHRA,
    stdMedical,
    stdConveyance,
    stdSpecial,
    actualBasic,
    actualHRA,
    actualMedical,
    actualConveyance,
    actualSpecial,
    finalSettlement,
    extraAllowances,
    totalExtraAllowances,
    totalEarningsA,
    pf: pfEmployee,
    pfEmployee,
    totalPfDeductionsB,
    professionalTax,
    otherTaxDeductions,
    totalTaxesDeductionsC,
    reimbursements,
    totalReimbursementsD,
    pfEmployer,
    pfOtherCharges,
    totalOtherComponentsE,
    customDeductions: otherTaxDeductions,
    totalDeductions,
    netPay,
    totalCost,
    actualGross: totalEarningsA,
    effectivePaidDays,
    daysPayable: effectivePaidDays,
    lopDays,
    totalWorkingDays,
    totalDaysInMonth: calendarDaysInMonth,
    fromDate,
    toDate,
  }
}
