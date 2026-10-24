import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'plain'; small?: boolean }

export function Button({ variant = 'plain', small = false, className = '', ...props }: ButtonProps) {
  const look =
    variant === 'primary'
      ? 'bg-accent text-white border-accent hover:brightness-110'
      : 'bg-surface text-ink border-line hover:border-accent'
  const size = small ? 'px-5 py-3 text-[15px]' : 'px-8 py-5 text-[19px]'
  return (
    <button
      className={`rounded-full border font-bold transition active:scale-[.97] disabled:opacity-50 ${look} ${size} ${className}`}
      {...props}
    />
  )
}

type StatProps = { label: string; value: ReactNode; unit?: string; tone: 'mint' | 'peach' | 'lilac' }

const TONES = { mint: 'bg-mint', peach: 'bg-peach', lilac: 'bg-lilac' }

export function StatTile({ label, value, unit, tone }: StatProps) {
  return (
    <div className={`rounded-3xl px-5 py-4 ${TONES[tone]}`}>
      <span className="text-sm text-muted">{label}</span>
      <span className="num mt-1 block text-4xl font-bold tracking-tight">
        {value}
        {unit && <small className="ml-1 text-lg font-medium text-muted">{unit}</small>}
      </span>
    </div>
  )
}

export function Bubble({ text, from }: { text: string; from: string }) {
  return (
    <div className="rounded-[22px] rounded-bl-md bg-surface px-5 py-4 font-bold shadow-soft">
      {text}
      <span className="block text-[13px] font-medium text-muted">{from}</span>
    </div>
  )
}
