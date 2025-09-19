'use client'

import { usePathname } from 'next/navigation'

interface ConditionalFooterProps {
  children: React.ReactNode
}

export default function ConditionalFooter({ children }: ConditionalFooterProps) {
  const pathname = usePathname()
  const hideFooter = pathname === '/login'
  
  if (hideFooter) {
    return null
  }
  
  return (
    <footer className="mt-auto w-full">
      {children}
    </footer>
  )
}