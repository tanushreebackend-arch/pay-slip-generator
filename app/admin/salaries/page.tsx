'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { formatCurrency, getErrorMessage } from '@/lib/utils'
import type { Employee } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function AdminSalariesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [ctc, setCtc] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/employees')
      if (!res.ok) throw new Error('Failed to load employees')
      const rows: Employee[] = await res.json()
      setEmployees(rows)
      const next: Record<string, string> = {}
      for (const emp of rows) {
        next[emp.id] = String(Math.round((emp.gross_salary || 0) * 12))
      }
      setCtc(next)
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to load salaries'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = async (id: string) => {
    const annual = parseFloat(ctc[id] || '')
    if (Number.isNaN(annual) || annual < 0) {
      toast.error('Enter a valid annual CTC')
      return
    }
    setSavingId(id)
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annual_ctc: annual }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save salary')
      toast.success('Salary updated')
      load()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to save salary'))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-text-primary">Employee Salaries</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Set each person&apos;s annual CTC. Monthly salary is CTC ÷ 12 and is what employees see in Finance.
        </p>
      </header>

      <div className="rounded-xl border border-border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Annual CTC</TableHead>
              <TableHead>Monthly Salary</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-text-muted">
                  Loading...
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-text-muted">
                  No employees yet
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => {
                const annual = parseFloat(ctc[emp.id] || '')
                const monthly = Number.isNaN(annual) ? 0 : annual / 12
                return (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell className="text-text-muted">{emp.employee_id}</TableCell>
                    <TableCell>{emp.department || '—'}</TableCell>
                    <TableCell className="w-44">
                      <Input
                        type="number"
                        min="0"
                        step="1000"
                        value={ctc[emp.id] ?? ''}
                        onChange={(e) => setCtc((prev) => ({ ...prev, [emp.id]: e.target.value }))}
                      />
                    </TableCell>
                    <TableCell>{formatCurrency(monthly)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" disabled={savingId === emp.id} onClick={() => save(emp.id)}>
                        {savingId === emp.id ? 'Saving...' : 'Save'}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
