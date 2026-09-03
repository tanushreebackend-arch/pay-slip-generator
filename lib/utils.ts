import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return fallback
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

/** Inclusive calendar days between two YYYY-MM-DD dates (e.g. Jul 8–Jul 11 = 4). */
export function calculateLeaveDays(fromDate: string, toDate: string): number {
  if (!fromDate || !toDate) return 0
  const from = new Date(fromDate + 'T12:00:00')
  const to = new Date(toDate + 'T12:00:00')
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0
  if (to < from) return 0
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.floor((to.getTime() - from.getTime()) / msPerDay) + 1
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

const CITY_PIN_RE =
  /(?:^|,)\s*((?:BENGALURU|BANGALORE|BENAGALURU))\s*,\s*(KARNATAKA\s+\d{6})\s*$/i
const STUCK_CITY_PIN_RE =
  /\s+((?:BENGALURU|BANGALORE|BENAGALURU))\s*,\s*(KARNATAKA\s+\d{6})\s*$/i

function joinAddressParts(parts: string[]): string {
  return parts.join(', ')
}

/** Split a company address into three lines for payslip/letter headers. */
export function formatPayslipAddressLines(address: string): string[] {
  const explicit = address
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (explicit.length >= 2) return explicit

  const raw = (explicit[0] || address).trim()
  if (!raw) return []

  const normalized = raw.replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ')
  let rest = normalized
  let cityLine = ''

  const cityPin = normalized.match(CITY_PIN_RE)
  const stuckCity = !cityPin ? normalized.match(STUCK_CITY_PIN_RE) : null
  if (cityPin && cityPin.index != null) {
    rest = normalized.slice(0, cityPin.index).replace(/,\s*$/, '').trim()
    cityLine = `${cityPin[1]}, ${cityPin[2]}`
  } else if (stuckCity && stuckCity.index != null) {
    rest = normalized.slice(0, stuckCity.index).replace(/,\s*$/, '').trim()
    cityLine = `${stuckCity[1]}, ${stuckCity[2]}`
  }

  const parts = rest.split(',').map((s) => s.trim()).filter(Boolean)
  if (cityLine) {
    const mid = Math.ceil(parts.length / 2) || 0
    return [joinAddressParts(parts.slice(0, mid)), joinAddressParts(parts.slice(mid)), cityLine].filter(
      Boolean
    )
  }

  if (parts.length <= 3) return parts
  const last = parts.length >= 2 ? joinAddressParts(parts.slice(-2)) : parts[parts.length - 1]
  const head = parts.length >= 2 ? parts.slice(0, -2) : parts
  const mid = Math.ceil(head.length / 2)
  return [joinAddressParts(head.slice(0, mid)), joinAddressParts(head.slice(mid)), last].filter(Boolean)
}

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
  document_font: 'arial',
  document_font_size: 100,
  payslip_custom_fields: [] as { label: string; value: string }[],
  relieving_letter_body: '',
  experience_letter_body: '',
}
