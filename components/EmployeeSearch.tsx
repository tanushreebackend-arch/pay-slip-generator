'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { Employee } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface EmployeeSearchProps {
  employees: Employee[]
  selected: Employee | null
  onSelect: (employee: Employee | null) => void
}

export default function EmployeeSearch({
  employees,
  selected,
  onSelect,
}: EmployeeSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return employees.slice(0, 20)
    return employees
      .filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.employee_id.toLowerCase().includes(q)
      )
      .slice(0, 20)
  }, [employees, query])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          placeholder="Search by name or employee ID..."
          className="pl-9"
          value={selected && !open ? selected.name : query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            if (!e.target.value) onSelect(null)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {open && filtered.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-border bg-background shadow-sm">
            {filtered.map((emp) => (
              <li key={emp.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-accent-light"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onSelect(emp)
                    setQuery('')
                    setOpen(false)
                  }}
                >
                  <span className="font-medium">{emp.name}</span>
                  <span className="text-text-secondary"> · {emp.employee_id}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <div className="rounded-lg border border-[#fecaca] bg-accent-light p-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-text-muted">Name</p>
              <p className="font-semibold text-text-primary">{selected.name}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Employee ID</p>
              <p className="font-medium text-text-primary">{selected.employee_id}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Designation</p>
              <p className="text-text-primary">{selected.designation || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted">Gross Salary</p>
              <p className="font-semibold text-text-primary">
                {formatCurrency(Number(selected.gross_salary))}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
