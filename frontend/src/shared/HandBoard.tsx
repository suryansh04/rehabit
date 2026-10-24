import { PALM_PAD } from './config'
import type { Hand } from './types'

// A right hand seen from above, palm down, so the thumb is on the left.
// Drawn as one outline: capsule fingers, round U-shaped gaps, a round palm.
// Each digit: base center x, y, angle (0 = straight up), length, width.
const DIGITS = [
  [78, 250, -58, 70, 50],
  [110, 150, -14, 92, 42],
  [158, 138, -2, 108, 44],
  [206, 146, 9, 98, 42],
  [248, 172, 22, 74, 38],
] as const
const VALLEY_DEPTH = 12
const PALM_BOTTOM = '276,290 256,320 C236,350 150,356 118,334'
const PALM_COIN = [168, 262] as const
const COIN_AT = 0.78
const FINGER_COIN_R = 14
const PALM_COIN_R = 28
const VIEW = { x: -12, y: -4, w: 310, h: 364 }
const MIRROR_X = 2 * VIEW.x + VIEW.w

type Digit = (typeof DIGITS)[number]
type Point = [number, number]

const fmt = ([x, y]: Point) => `${x.toFixed(1)},${y.toFixed(1)}`

// side -1 is the digit's left edge, +1 its right edge, 0 its middle line
function along([bx, by, angle, length, width]: Digit, t: number, side = 0): Point {
  const a = (angle * Math.PI) / 180
  return [
    bx + Math.sin(a) * length * t + Math.cos(a) * side * (width / 2),
    by - Math.cos(a) * length * t + Math.sin(a) * side * (width / 2),
  ]
}

function digitEdge(d: Digit) {
  const r = d[4] / 2
  return `L${fmt(along(d, 1, -1))} A${r},${r} 0 0 1 ${fmt(along(d, 1, 1))} L${fmt(along(d, 0, 1))}`
}

const below = ([x, y]: Point, dy: number): Point => [x, y + dy]

// Every join leaves and enters along the digit's own direction, so there are no corners.
function outline() {
  const [thumb, ...fingers] = DIGITS
  const index = fingers[0]
  const little = fingers[fingers.length - 1]
  let path = `M118,334 C100,326 ${fmt(along(thumb, -0.45, -1))} ${fmt(along(thumb, 0, -1))} ${digitEdge(thumb)}`

  // the soft web between thumb and index dips into the palm
  path += ` C${fmt(along(thumb, -0.2, 1))} ${fmt(along(index, -0.9, -1))} ${fmt(along(index, 0, -1))}`

  fingers.forEach((finger, i) => {
    path += ` ${digitEdge(finger)}`
    const next = fingers[i + 1]
    if (!next) return
    const from = along(finger, 0, 1)
    const to = along(next, 0, -1)
    path += ` C${fmt(below(from, VALLEY_DEPTH))} ${fmt(below(to, VALLEY_DEPTH))} ${fmt(to)}`
  })
  return `${path} C${fmt(along(little, -0.7, 1))} ${PALM_BOTTOM} Z`
}

const OUTLINE = outline()
const COINS = [...DIGITS.slice(1).map((d) => along(d, COIN_AT)), PALM_COIN]
// the thumb coin sits a little further out on the shorter thumb
COINS.unshift(along(DIGITS[0], 0.72))

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

  return (
    <svg
      viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
      width={size}
      overflow="visible"
      role="img"
      aria-label={`${hand} hand board${live ? `, coin ${live} glowing` : ''}`}
    >
      <path
        d={OUTLINE}
        transform={mirror}
        fill="var(--color-hand)"
        stroke="var(--color-hand-line)"
        strokeWidth={4}
        strokeLinejoin="round"
      />
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
