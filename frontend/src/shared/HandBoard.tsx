import { useId } from 'react'
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
  'M182,488 Q162,488 157,470 C148,440 138,420 136,390 C132,352 138,320 152,288 C158,262 160,240 172,224 ' +
  'Q184,210 204,210 L270,214 Q304,220 308,256 C309,290 306,320 304,352 C301,400 294,440 287,468 Q282,488 262,488 Z'
const PALM_COIN = [224, 340] as const
const COIN_AT = 0.8
const FINGER_COIN_R = 15
const PALM_COIN_R = 30
const VIEW = { x: 20, y: 30, w: 350, h: 470 }
const MIRROR_X = 2 * VIEW.x + VIEW.w
// Blur then sharpen the alpha: the fingers melt into the palm with round curves instead of sharp corners.
const SMOOTH_BLUR = 5
const SMOOTH_ALPHA = '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10'

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
  // useId has colons, which break url(#...) references
  const smooth = `hand-smooth-${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <svg
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
      width={size}
      role="img"
      aria-label={`${hand} hand board${live ? `, coin ${live} glowing` : ''}`}
    >
      <defs>
        <filter id={smooth} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={SMOOTH_BLUR} />
          <feColorMatrix type="matrix" values={SMOOTH_ALPHA} />
        </filter>
      </defs>
      <g transform={mirror}>
        <g filter={`url(#${smooth})`} fill="var(--color-hand-line)" stroke="var(--color-hand-line)" strokeWidth={8} strokeLinejoin="round">
          {shapes}
        </g>
        <g filter={`url(#${smooth})`} fill="var(--color-hand)">
          {shapes}
        </g>
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
