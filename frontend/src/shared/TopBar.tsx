import type { ReactNode } from 'react'

export function Logo() {
  return <img src="/logo.png" alt="Rehabit" className="h-9 w-auto" />
}

export function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-line bg-surface px-4 py-2 text-sm">{children}</span>
}

export function TopBar({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  return (
    <header className="flex items-center gap-3">
      <Logo />
      {left}
      <div className="ml-auto flex items-center gap-2.5">{right}</div>
    </header>
  )
}
