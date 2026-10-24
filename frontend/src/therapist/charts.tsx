const ACCENT = 'var(--color-accent)'
const QUIET = 'var(--color-lilac)'
const MUTED = 'var(--color-muted)'
const INK = 'var(--color-ink)'
const LINE = 'var(--color-line)'
const BAR_RADIUS = 6
const LABEL_SIZE = 12

export function Sparkline({ values, width = 170, height = 44 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return <svg width={width} height={height} aria-hidden />
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const pad = 5
  const points = values.map((v, i) => [
    (i * width) / (values.length - 1),
    height - pad - ((v - lo) / (hi - lo || 1)) * (height - 2 * pad),
  ])
  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ')
  const [lastX, lastY] = points[points.length - 1]
  return (
    <svg viewBox={`-6 -6 ${width + 12} ${height + 12}`} width={width} height={height} aria-hidden>
      <path d={`${line} L${width},${height} L0,${height} Z`} fill={ACCENT} fillOpacity={0.08} />
      <path d={line} fill="none" stroke={ACCENT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={4.5} fill={ACCENT} stroke="var(--color-surface)" strokeWidth={2} />
    </svg>
  )
}

export type Bar = { label: string; value: number | null; note?: string }

type MsBarsProps = { bars: Bar[]; highlight: number; width?: number; height?: number }

// Plain bars from a zero baseline: taller means more milliseconds, so lower is better.
// Only the highlighted bar carries a number; hover shows the rest.
export function MsBars({ bars, highlight, width = 360, height = 170 }: MsBarsProps) {
  const top = 22
  const base = height - 22
  const max = Math.max(...bars.map((b) => b.value ?? 0), 1)
  const slot = width / bars.length
  const barWidth = Math.min(34, slot * 0.6)
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Reaction time in milliseconds">
      <line x1={0} y1={base} x2={width} y2={base} stroke={LINE} strokeWidth={1} />
      {bars.map((bar, i) => {
        const x = i * slot + (slot - barWidth) / 2
        const h = bar.value === null ? 0 : Math.max(BAR_RADIUS * 2, ((base - top) * bar.value) / max)
        const on = i === highlight
        return (
          <g key={bar.label + i}>
            <title>{bar.value === null ? `${bar.label}: no game` : `${bar.label}: ${Math.round(bar.value)} ms${bar.note ? ` · ${bar.note}` : ''}`}</title>
            <rect x={i * slot} y={0} width={slot} height={height} fill="transparent" />
            {bar.value === null ? (
              <text x={x + barWidth / 2} y={base - 6} fontSize={LABEL_SIZE} textAnchor="middle" fill={MUTED}>-</text>
            ) : (
              <path
                d={`M${x},${base} V${base - h + BAR_RADIUS} Q${x},${base - h} ${x + BAR_RADIUS},${base - h} H${x + barWidth - BAR_RADIUS} Q${x + barWidth},${base - h} ${x + barWidth},${base - h + BAR_RADIUS} V${base} Z`}
                fill={on ? ACCENT : QUIET}
              />
            )}
            {on && bar.value !== null && (
              <text x={x + barWidth / 2} y={base - h - 7} fontSize={LABEL_SIZE} fontWeight={700} textAnchor="middle" fill={INK}>
                {Math.round(bar.value)}
              </text>
            )}
            <text x={x + barWidth / 2} y={height - 4} fontSize={LABEL_SIZE} textAnchor="middle" fill={on ? INK : MUTED}>
              {bar.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
