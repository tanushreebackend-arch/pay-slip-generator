import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (value: number): string => {
  return (
    '₹' +
    value.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )
}

export function formatDateDDMMYYYY(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return dateStr
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function formatDateDDMonthYYYY(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return dateStr
  const day = String(d.getDate()).padStart(2, '0')
  const month = MONTHS[d.getMonth()]
  return `${day} ${month} ${d.getFullYear()}`
}

export function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function getMonthDateRange(monthName: string, yearStr: string): {
  from_date: string
  to_date: string
} {
  const monthIndex = MONTHS.indexOf(monthName as (typeof MONTHS)[number])
  const y = parseInt(yearStr, 10) || new Date().getFullYear()
  const m = monthIndex >= 0 ? monthIndex : new Date().getMonth()
  return {
    from_date: toDateString(new Date(y, m, 1)),
    to_date: toDateString(new Date(y, m + 1, 0)),
  }
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

export const PAYMENT_MODES = ['Bank Transfer', 'Cash', 'Cheque'] as const

export const emptySettings = {
  id: '',
  company_name: '',
  address: '',
  email: '',
  phone: '',
  website: '',
  signatory_name: '',
  signatory_designation: '',
  logo_url: '',
  signature_url: '',
  payslip_custom_fields: [] as { label: string; value: string }[],
}
