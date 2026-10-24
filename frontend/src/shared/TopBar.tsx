import type { ReactNode } from 'react'

export function Logo() {
  return (
    <span className="text-2xl font-bold tracking-tight">
      rehabit<span className="ml-0.5 inline-block size-2.5 rounded-full bg-accent" />
    </span>
  )
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
