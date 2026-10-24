const ACCENT = 'var(--color-accent)'
const QUIET = 'var(--color-lilac)'
const MUTED = 'var(--color-muted)'
const LINE = 'var(--color-line)'

export function Sparkline({ values, width = 170, height = 40 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return <svg width={width} height={height} />
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const pad = 4
  const points = values.map((v, i) => [
    (i * width) / (values.length - 1),
    height - pad - ((v - lo) / (hi - lo || 1)) * (height - 2 * pad),
  ])
  const [lastX, lastY] = points[points.length - 1]
  return (
    <svg viewBox={`-5 -5 ${width + 10} ${height + 10}`} width={width} height={height} aria-hidden>
      <path
        d={points.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ')}
        fill="none"
        stroke={ACCENT}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={5} fill={ACCENT} />
    </svg>
  )
}

type Bar = { label: string; value: number | null }

// Lower reaction time is better, so a faster day gets a taller bar.
export function ReactionBars({ bars, height = 160 }: { bars: Bar[]; height?: number }) {
  const values = bars.flatMap((b) => (b.value === null ? [] : [b.value]))
  const slowest = Math.max(...values, 1)
  const fastest = Math.min(...values, slowest)
  const width = 360
  const slot = width / bars.length
  const barWidth = slot * 0.72
  const base = height - 20
  const tallest = height - 50
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Average reaction time per day">
      {bars.map((bar, i) => {
        const x = i * slot + (slot - barWidth) / 2
        const h = bar.value === null ? 0 : 24 + ((slowest - bar.value) / (slowest - fastest || 1)) * (tallest - 24)
        const last = i === bars.length - 1
        return (
          <g key={bar.label + i}>
            {bar.value !== null && (
              <>
                <rect x={x} y={base - h} width={barWidth} height={h} rx={12} fill={last ? ACCENT : QUIET} />
                <text x={x + barWidth / 2} y={base - h - 6} fontSize={11} fontWeight={700} textAnchor="middle" fill="var(--color-ink)">
                  {Math.round(bar.value)}
                </text>
              </>
            )}
            <text x={x + barWidth / 2} y={height - 2} fontSize={11} textAnchor="middle" fill={MUTED}>
              {bar.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

type Point = { mood: number; reaction: number }

// Mood on the x axis, reaction time on y with faster at the top.
export function MoodScatter({ points, width = 300, height = 160 }: { points: Point[]; width?: number; height?: number }) {
  const reactions = points.map((p) => p.reaction)
  const slow = Math.max(...reactions, 1)
  const fast = Math.min(...reactions, slow)
  const left = 20
  const span = width - 2 * left
  return (
    <svg viewBox={`0 0 ${width} ${height + 6}`} width="100%" role="img" aria-label="Mood against reaction time">
      <line x1={left} y1={height - 14} x2={width - left} y2={height - 14} stroke={LINE} strokeWidth={2} />
      {[1, 2, 3, 4, 5].map((m) => (
        <text key={m} x={left + ((m - 1) / 4) * span} y={height + 2} fontSize={12} textAnchor="middle" fill={MUTED}>
          {m}
        </text>
      ))}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={left + ((p.mood - 1) / 4) * span}
          cy={14 + ((p.reaction - fast) / (slow - fast || 1)) * (height - 44)}
          r={9}
          fill={ACCENT}
          fillOpacity={0.7}
        />
      ))}
    </svg>
  )
}
