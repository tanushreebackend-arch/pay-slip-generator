'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  Users,
  FileText,
  Mail,
  Settings,
  LayoutDashboard,
  Clock,
  CalendarDays,
  LogOut,
  ClipboardList,
  BarChart3,
  DollarSign,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const adminNav = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/payslip', label: 'Payslip', icon: FileText },
  { href: '/letters', label: 'Letters', icon: Mail },
  { href: '/admin/attendance', label: 'Attendance', icon: Clock },
  { href: '/admin/leaves', label: 'Leave Requests', icon: ClipboardList },
  { href: '/admin/salaries', label: 'Salaries', icon: Wallet },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const employeeNav = [
  { href: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employee/attendance', label: 'Attendance', icon: Clock },
  { href: '/employee/leaves', label: 'Leaves', icon: CalendarDays },
  { href: '/employee/finance', label: 'Finance', icon: DollarSign },
  { href: '/employee/documents', label: 'Documents', icon: FileText },
]

const adminPaths = ['/employees', '/payslip', '/letters', '/settings', '/admin']

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const onAdminPath = adminPaths.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
  const showAdminNav =
    session?.user?.role === 'ADMIN' || (status === 'loading' && onAdminPath)
  const navItems = showAdminNav ? adminNav : employeeNav

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-border bg-sidebar-bg print:hidden">
      <div className="flex items-center gap-2.5 px-4 pb-4 pt-5">
        <Image
          src="/company-logo.png"
          alt="PurpleMerit"
          width={32}
          height={32}
          className="rounded-md"
        />
        <div>
          <h1 className="text-[15px] font-bold text-text-primary">
            <span className="text-accent">Purple</span>Merit
          </h1>
          <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
            HRMS PORTAL
          </p>
        </div>
      </div>
      <div className="mb-2 border-b border-border" />
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
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
      <div className="border-t border-border p-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
            {(session?.user?.name || session?.user?.email || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-text-primary">
              {session?.user?.name || session?.user?.email}
            </p>
            <p className="text-[10px] text-text-muted">
              {showAdminNav ? 'Admin' : 'Employee'}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
