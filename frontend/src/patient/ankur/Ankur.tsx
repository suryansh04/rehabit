import type { ReactNode } from 'react'
import './ankur.css'

// Drawing comes from design/round-05-mascot/ankur.py.
export type AnkurState =
  | 'idle' | 'watch' | 'happy' | 'cheer' | 'encourage' | 'push'
  | 'listen' | 'speak' | 'celebrate' | 'comfort' | 'think' | 'sleepy'

type Eyes = 'open' | 'happy' | 'closed' | 'kind' | 'focus'
type Mouth = 'smile' | 'big' | 'soft' | 'talk' | 'o'
type Extra = 'sparkle' | 'look' | 'glow' | 'zzz' | 'flower'

const LOOK: Record<AnkurState, { eyes: Eyes; mouth: Mouth; extra?: Extra[] }> = {
  idle: { eyes: 'open', mouth: 'smile' },
  watch: { eyes: 'open', mouth: 'smile', extra: ['look'] },
  happy: { eyes: 'happy', mouth: 'smile' },
  cheer: { eyes: 'happy', mouth: 'big', extra: ['sparkle'] },
  encourage: { eyes: 'kind', mouth: 'soft' },
  push: { eyes: 'focus', mouth: 'smile' },
  listen: { eyes: 'open', mouth: 'soft' },
  speak: { eyes: 'open', mouth: 'talk' },
  celebrate: { eyes: 'happy', mouth: 'big', extra: ['sparkle', 'flower'] },
  comfort: { eyes: 'closed', mouth: 'soft', extra: ['glow'] },
  think: { eyes: 'open', mouth: 'o' },
  sleepy: { eyes: 'closed', mouth: 'o', extra: ['zzz'] },
}

const C = {
  body: '#8BD47E', shade: '#6DBE63', hi: '#B8EBAA', leaf: '#5FB257', leafDark: '#4A9A45',
  pot: '#D9774B', rim: '#E58C5F', potDark: '#B85E36', soil: '#6B4A3A', ink: '#1B1530',
  cheek: '#FF9F8A', petal: '#FFB3C7', center: '#FFD45C', gold: '#FFC93C',
}
const LEAF = 'M0,0 Q13,-11 28,-2 Q14,9 0,0 Z'
const CROWN = [
  ['translate(100 60) rotate(-150) scale(1.15)', C.leaf],
  ['translate(100 60) rotate(-30) scale(1.15)', C.leaf],
  ['translate(99 70) rotate(-165) scale(.85)', C.leafDark],
  ['translate(100 70) rotate(-15) scale(.85)', C.leafDark],
]
const SPARKS = [[40, 60], [160, 52], [34, 120], [168, 112], [60, 30], [140, 26]]
const line = { stroke: C.ink, fill: 'none', strokeLinecap: 'round' as const }

function EyesPart({ kind }: { kind: Eyes }) {
  if (kind === 'happy') return <path d="M81,114 Q87,106 93,114 M107,114 Q113,106 119,114" strokeWidth={3.2} {...line} />
  if (kind === 'closed') return <path d="M81,111 Q87,117 93,111 M107,111 Q113,117 119,111" strokeWidth={3} {...line} />
  if (kind === 'kind') return <path d="M81,113 Q87,108 93,113 M107,113 Q113,108 119,113" strokeWidth={3} {...line} />
  return (
    <>
      <ellipse cx="87" cy="112" rx="5.5" ry="6.5" fill={C.ink} />
      <ellipse cx="113" cy="112" rx="5.5" ry="6.5" fill={C.ink} />
      <circle cx="89" cy="109.5" r="1.8" fill="#fff" />
      <circle cx="115" cy="109.5" r="1.8" fill="#fff" />
      {kind === 'focus' && <path d="M81,103 L92,104.5 M108,104.5 L119,103" strokeWidth={2.6} {...line} />}
    </>
  )
}

function MouthPart({ kind }: { kind: Mouth }) {
  if (kind === 'big')
    return (
      <>
        <path d="M89,122 Q100,138 111,122 Z" fill={C.ink} />
        <path d="M94,129 Q100,134 106,129" fill="#FF8A80" />
      </>
    )
  if (kind === 'soft') return <path d="M95,125 Q100,128 105,125" strokeWidth={2.8} {...line} />
  if (kind === 'talk') return <ellipse className="ank-talk" cx="100" cy="126" rx="5" ry="4" fill={C.ink} />
  if (kind === 'o') return <ellipse cx="100" cy="126" rx="3" ry="3.5" fill={C.ink} />
  return <path d="M92,124 Q100,131 108,124" strokeWidth={3} {...line} />
}

function Flower() {
  return (
    <g className="ank-flower">
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="100" cy="44" rx="6" ry="9" fill={C.petal} transform={`rotate(${a} 100 52)`} />
      ))}
      <circle cx="100" cy="52" r="6" fill={C.center} />
    </g>
  )
}

function star(x: number, y: number) {
  return `M${x},${y - 7} L${x + 2},${y - 2} L${x + 7},${y} L${x + 2},${y + 2} L${x},${y + 7} L${x - 2},${y + 2} L${x - 7},${y} L${x - 2},${y - 2} Z`
}

export function Ankur({ state, size }: { state: AnkurState; size: number }) {
  const { eyes, mouth, extra = [] } = LOOK[state]
  const has = (e: Extra) => extra.includes(e)
  let face: ReactNode = (
    <>
      <EyesPart kind={eyes} />
      <MouthPart kind={mouth} />
    </>
  )
  if (has('look')) face = <g className="ank-look">{face}</g>

  return (
    <svg viewBox="20 10 160 210" width={size} className={`ankur ank-${state}`} role="img" aria-label={`Ankur, ${state}`}>
      {has('glow') && <circle className="ank-glow" cx="100" cy="120" r="62" fill={C.gold} opacity={0.18} />}
      <ellipse cx="100" cy="213" rx="46" ry="6" fill={C.ink} opacity={0.08} />
      <g className="ank-plant">
        <g className="ank-arm ank-arm-l">
          <path d={LEAF} fill={C.leaf} transform="translate(64 128) scale(-1 1)" />
        </g>
        <g className="ank-arm ank-arm-r">
          <path d={LEAF} fill={C.leaf} transform="translate(136 128)" />
        </g>
        <g className="ank-crown">
          <path d="M100,80 Q97,68 100,56" stroke={C.leafDark} strokeWidth={4} fill="none" strokeLinecap="round" />
          {CROWN.map(([tf, color]) => (
            <path key={tf} d={LEAF} fill={color} transform={tf} />
          ))}
          {has('flower') && <Flower />}
        </g>
        <ellipse cx="100" cy="120" rx="38" ry="41" fill={C.body} />
        <path d="M64,128 Q100,170 136,128 Q132,160 100,161 Q68,160 64,128 Z" fill={C.shade} opacity={0.7} />
        <ellipse cx="84" cy="96" rx="9" ry="6" fill={C.hi} opacity={0.8} transform="rotate(-25 84 96)" />
        <ellipse cx="78" cy="124" rx="6" ry="4" fill={C.cheek} opacity={0.75} />
        <ellipse cx="122" cy="124" rx="6" ry="4" fill={C.cheek} opacity={0.75} />
        <g className="ank-face">{face}</g>
      </g>
      <path d="M60,160 L140,160 L131,206 Q100,214 69,206 Z" fill={C.pot} />
      <rect x="54" y="150" width="92" height="16" rx="7" fill={C.rim} />
      <ellipse cx="100" cy="151" rx="40" ry="4" fill={C.soil} />
      <path d="M70,182 Q100,190 130,182" stroke="#fff" strokeWidth={3} fill="none" strokeDasharray="2 7" strokeLinecap="round" opacity={0.75} />
      <path d="M66,170 L134,170" stroke={C.potDark} strokeWidth={2} opacity={0.35} />
      {has('sparkle') &&
        SPARKS.map(([x, y], i) => (
          <path key={i} className="ank-spark" style={{ animationDelay: `${i * 90}ms` }} d={star(x, y)} fill={C.gold} />
        ))}
      {has('zzz') && (
        <text className="ank-z" x="138" y="70" fontSize={22} fontWeight={700} fill="var(--color-muted)">
          z
        </text>
      )}
    </svg>
  )
}
