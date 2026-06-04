'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, FileText, Mail, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/payslip', label: 'Payslip', icon: FileText },
  { href: '/letters', label: 'Letters', icon: Mail },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col border-r border-border bg-background print:hidden">
      <div className="px-4 pb-4 pt-5">
        <h1 className="text-[15px] font-bold text-text-primary">PayGen</h1>
        <p className="mt-0.5 text-[11px] text-text-muted">Payroll Manager</p>
      </div>
      <div className="mb-2 border-b border-border" />
      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-md py-2 pl-3 pr-3 text-[13px] transition-colors duration-150',
                active
                  ? 'border-l-[3px] border-l-accent bg-accent-light pl-[9px] font-semibold text-accent'
                  : 'border-l-[3px] border-l-transparent text-text-secondary hover:bg-accent-light hover:text-accent'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
