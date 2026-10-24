import { PALM_PAD } from './config'
import type { Hand } from './types'

// Geometry comes from design/hand/hand.py: a right hand seen from above, palm down, thumb on the left.
// Each finger: base x, base y, angle (0 = up), length, base width, tip width.
const FINGERS = [
  [154, 350, -56, 108, 54, 44],
  [178, 222, -9, 140, 45, 38],
  [220, 212, -1, 158, 47, 39],
  [260, 222, 7, 144, 44, 37],
  [294, 252, 17, 108, 38, 32],
] as const
const PALM =
  'M170,488 C160,452 150,424 140,392 C128,360 134,322 150,286 L162,236 Q170,214 196,210 ' +
  'L272,214 Q306,222 308,258 L304,352 C300,406 290,446 280,488 Z'
const PALM_COIN = [224, 340] as const
const COIN_AT = 0.8
const FINGER_COIN_R = 15
const PALM_COIN_R = 30
const VIEW = { x: 20, y: 30, w: 350, h: 470 }
const MIRROR_X = 2 * VIEW.x + VIEW.w

type Finger = (typeof FINGERS)[number]

function point([bx, by, angle, length, wb, wt]: Finger, t: number, side = 0) {
  const a = (angle * Math.PI) / 180
  const width = wb + (wt - wb) * t
  return [
    bx + Math.sin(a) * length * t + Math.cos(a) * side * (width / 2),
    by - Math.cos(a) * length * t + Math.sin(a) * side * (width / 2),
  ]
}

function fingerPath(f: Finger) {
  const [x1, y1] = point(f, -0.15, -1)
  const [x2, y2] = point(f, 1, -1)
  const [x3, y3] = point(f, 1, 1)
  const [x4, y4] = point(f, -0.15, 1)
  const r = f[5] / 2
  return `M${x1},${y1} L${x2},${y2} A${r},${r} 0 0 1 ${x3},${y3} L${x4},${y4} Z`
}

const SHAPES = [PALM, ...FINGERS.map(fingerPath)]
const COINS = [...FINGERS.map((f) => point(f, COIN_AT)), PALM_COIN]

export type Flash = { pad: number; kind: 'hit' | 'miss' }

type Props = {
  hand: Hand
  size: number
  live?: number | null
  flash?: Flash | null
  dimPalm?: boolean
}

function coinFill(pad: number, live: Props['live'], flash: Props['flash']) {
  if (flash?.pad === pad) return flash.kind === 'hit' ? 'var(--color-hit)' : 'var(--color-miss)'
  return pad === live ? 'var(--color-accent)' : 'var(--color-coin)'
}

export function HandBoard({ hand, size, live = null, flash = null, dimPalm = false }: Props) {
  const mirror = hand === 'left' ? `translate(${MIRROR_X} 0) scale(-1 1)` : undefined
  const shapes = SHAPES.map((d) => <path key={d} d={d} />)

  return (
    <svg
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
      width={size}
      role="img"
      aria-label={`${hand} hand board${live ? `, coin ${live} glowing` : ''}`}
    >
      <g transform={mirror}>
        <g fill="var(--color-hand-line)" stroke="var(--color-hand-line)" strokeWidth={5} strokeLinejoin="round">
          {shapes}
        </g>
        <g fill="var(--color-hand)">{shapes}</g>
      </g>
      {COINS.map(([x, y], i) => {
        const pad = i + 1
        const cx = hand === 'left' ? MIRROR_X - x : x
        const r = pad === PALM_PAD ? PALM_COIN_R : FINGER_COIN_R
        const lit = pad === live || flash?.pad === pad
        return (
          <g key={pad} opacity={dimPalm && pad === PALM_PAD ? 0.35 : 1}>
            {pad === live && <circle className="coin-halo" cx={cx} cy={y} r={r + 12} fill="var(--color-glow)" />}
            <circle cx={cx} cy={y} r={r} fill={coinFill(pad, live, flash)} style={{ transition: 'fill 150ms' }} />
            <text
              x={cx}
              y={y + 5}
              textAnchor="middle"
              fontSize={15}
              fontWeight={700}
              fill={lit ? '#fff' : 'var(--color-muted)'}
            >
              {pad}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
