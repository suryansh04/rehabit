import type { ReactNode } from 'react'

const TICK_GAP_DEG = 3
const TICK_WIDTH = 16
const RING_INSET = 20
const DISK_INSET = 30

type Props = {
  lit: number
  total: number
  size: number
  showTicks?: boolean
  children: ReactNode
}

// One tick per tap, so progress is something the patient sees grow.
export function Ring({ lit, total, size, showTicks = true, children }: Props) {
  const c = size / 2
  const r = c - RING_INSET
  const step = 360 / total
  const at = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180
    return `${c + r * Math.cos(a)},${c + r * Math.sin(a)}`
  }

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        <circle cx={c} cy={c} r={r - DISK_INSET} fill="var(--color-surface)" />
        {showTicks &&
          Array.from({ length: total }, (_, i) => (
            <path
              key={i}
              d={`M${at(i * step + TICK_GAP_DEG)} A${r},${r} 0 0 1 ${at((i + 1) * step - TICK_GAP_DEG)}`}
              stroke={i < lit ? 'var(--color-accent)' : 'var(--color-lilac)'}
              strokeWidth={TICK_WIDTH}
              strokeLinecap="round"
              fill="none"
              style={{ transition: 'stroke 300ms' }}
            />
          ))}
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}
