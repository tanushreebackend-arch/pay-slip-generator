'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PrintButtonProps {
  className?: string
}

export default function PrintButton({ className }: PrintButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      className={cn('w-full', className)}
      onClick={() => window.print()}
    >
      <Printer className="h-4 w-4 mr-2" />
      Print / Download PDF
    </Button>
  )
}
