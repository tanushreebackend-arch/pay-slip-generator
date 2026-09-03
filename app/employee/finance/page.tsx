'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getErrorMessage, formatCurrency } from '@/lib/utils'
import { Wallet, DollarSign, TrendingUp } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type PayrollRow = {
  month: number
  monthName: string
  year: number
  grossPay: number
  deductions: number
  netPay: number
  status: string
}

type FinanceData = {
  annualCTC: number
  monthlySalary: number
  ytdEarnings: number
  payrollHistory: PayrollRow[]
}

export default function EmployeeFinancePage() {
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/employee/finance')
      if (!res.ok) throw new Error('Failed to load finance data')
      setData(await res.json())
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load finance'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const summaryCards = data ? [
    {
      label: 'My Total CTC',
      value: formatCurrency(data.annualCTC),
      icon: Wallet,
      color: 'bg-violet-100 text-violet-700',
    },
    {
      label: 'My Monthly Salary',
      value: formatCurrency(data.monthlySalary),
      icon: DollarSign,
      color: 'bg-green-100 text-green-700',
    },
    {
      label: 'YTD Earnings',
      value: formatCurrency(data.ytdEarnings),
      icon: TrendingUp,
      color: 'bg-blue-100 text-blue-700',
    },
  ] : []

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-accent-light px-6 py-4 text-center">
        <h1 className="text-xl font-semibold text-text-primary">
          Finance <span className="text-accent">Overview</span>
        </h1>
      </div>

      {loading ? (
        <p className="text-sm text-text-muted">Loading...</p>
      ) : data ? (
        <>
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              My <span className="text-accent">Payroll</span>
            </h2>
            <p className="text-sm text-text-secondary">
              View your personal salary breakdown and payslips.
            </p>
          </div>

          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {summaryCards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-border bg-background p-5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{value}</p>
                  <p className="text-xs text-text-muted">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Payroll History */}
          <div>
            <h3 className="mb-1 text-base font-semibold text-text-primary">Payroll History</h3>
            <p className="mb-3 text-sm text-text-secondary">
              Download your salary slips for paid payrolls.
            </p>
            <div className="rounded-xl border border-border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PAYROLL MONTH</TableHead>
                    <TableHead>GROSS PAY</TableHead>
                    <TableHead>DEDUCTIONS</TableHead>
                    <TableHead>NET PAY</TableHead>
                    <TableHead>STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.payrollHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-text-muted">
                        No records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.payrollHistory.map(row => (
                      <TableRow key={`${row.year}-${row.month}`}>
                        <TableCell className="font-medium">
                          {row.monthName} {row.year}
                        </TableCell>
                        <TableCell>{formatCurrency(row.grossPay)}</TableCell>
                        <TableCell className={row.deductions > 0 ? 'text-red-600' : ''}>
                          {row.deductions > 0 ? `-${formatCurrency(row.deductions)}` : formatCurrency(0)}
                        </TableCell>
                        <TableCell className="font-medium text-green-700">
                          {formatCurrency(row.netPay)}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            row.status === 'Paid'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-violet-100 text-violet-700'
                          }`}>
                            {row.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
