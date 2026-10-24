import { Gamepad2, LayoutGrid, ListChecks, Phone, Settings, Smile, type LucideIcon } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { MODE_ORDER, MODES } from '../patient/games/modes'
import { Logo, Pill } from '../shared/TopBar'
import { callNow, getConfig, getSessions } from '../shared/api'
import { average, clockTime, dayKey, lastDays, scoreUnit, whenText } from '../shared/stats'
import type { ModeId, PublicConfig, Session } from '../shared/types'
import { MoodScatter, ReactionBars, Sparkline } from './charts'

const WINDOW_DAYS = 7
const HISTORY_ROWS = 8

const NAV: [string, LucideIcon][] = [
  ['Overview', LayoutGrid],
  ['Sessions', ListChecks],
  ['Games', Gamepad2],
  ['Mood', Smile],
  ['Calls', Phone],
  ['Settings', Settings],
]

type CallState = { kind: 'idle' } | { kind: 'calling' } | { kind: 'ok' } | { kind: 'error'; message: string }

function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <section className={`rounded-card p-6 ${className}`}>{children}</section>
}

function Big({ value, unit, light = false }: { value: string | number; unit?: string; light?: boolean }) {
  return (
    <span className="num my-1.5 block text-[40px] font-bold leading-none tracking-tight">
      {value}
      {unit && <small className={`ml-1 text-lg font-medium ${light ? 'text-white/70' : 'text-muted'}`}>{unit}</small>}
    </span>
  )
}

function byDay(sessions: Session[], days: Date[], pick: (rows: Session[]) => number) {
  return days.map((day) => {
    const rows = sessions.filter((s) => s.started_at.startsWith(dayKey(day)))
    return rows.length ? pick(rows) : null
  })
}

function minutesBefore(hhmm: string, minutes: number) {
  const [h, m] = hhmm.split(':').map(Number)
  const total = h * 60 + m - minutes
  return clockTime(`${Math.floor(total / 60)}:${total % 60}`)
}

export function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [config, setConfig] = useState<PublicConfig | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [call, setCall] = useState<CallState>({ kind: 'idle' })

  useEffect(() => {
    Promise.all([getSessions(), getConfig()])
      .then(([rows, cfg]) => {
        setSessions(rows)
        setConfig(cfg)
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  const startCall = async () => {
    setCall({ kind: 'calling' })
    try {
      await callNow()
      setCall({ kind: 'ok' })
    } catch (e) {
      setCall({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  const days = lastDays(WINDOW_DAYS)
  // a game with no good taps has no reaction time, so it must not pull the averages down
  const timed = sessions.filter((s) => s.avg_reaction_ms > 0)
  const reactionByDay = byDay(timed, days, (rows) => average(rows.map((s) => s.avg_reaction_ms)))
  const known = reactionByDay.filter((v): v is number => v !== null)
  const latestReaction = known.at(-1)
  const firstReaction = known[0]
  const moodPoints = timed.filter((s) => s.mood !== null).map((s) => ({ mood: s.mood as number, reaction: s.avg_reaction_ms }))
  const modeTrend = (mode: ModeId) =>
    byDay(sessions.filter((s) => s.mode === mode), days, (rows) => average(rows.map((s) => s.score))).filter(
      (v): v is number => v !== null,
    )
  const latestOf = (mode: ModeId) => sessions.find((s) => s.mode === mode)

  return (
    <div className="flex min-h-screen gap-5 p-5">
      <nav className="flex w-56 shrink-0 flex-col gap-1 rounded-card bg-surface px-4 py-6 shadow-soft">
        <div className="px-3 pb-5">
          <Logo />
        </div>
        {NAV.map(([label, Icon], i) => (
          <a
            key={label}
            href={i === 0 ? '#' : undefined}
            aria-current={i === 0 ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 ${
              i === 0 ? 'bg-accent font-bold text-white' : 'cursor-default text-muted'
            }`}
          >
            <Icon size={20} strokeWidth={2} />
            {label}
          </a>
        ))}
        {config && (
          <div className="mt-auto flex items-center gap-2.5 rounded-[20px] bg-bg p-3.5">
            <span className="grid size-10 place-items-center rounded-xl bg-lilac font-bold text-accent-ink">
              {config.patient_name.split(' ').map((w) => w[0]).join('')}
            </span>
            <div>
              <b className="block text-[15px]">{config.patient_name}</b>
              <span className="text-[13px] text-muted">Patient</span>
            </div>
          </div>
        )}
      </nav>

      <div className="flex min-w-0 flex-1 flex-col gap-4 pt-1.5">
        <header className="flex items-center">
          <h1 className="text-[28px] font-bold tracking-tight">Overview</h1>
          <span className="ml-auto">
            <Pill>Last {WINDOW_DAYS} days</Pill>
          </span>
        </header>
        {error && <p className="text-error">We could not load the sessions: {error}</p>}

        <div className="grid grid-cols-4 gap-4">
          {MODE_ORDER.map((mode) => {
            const latest = latestOf(mode)
            return (
              <Card key={mode} className="bg-surface shadow-soft">
                <b className="block">{MODES[mode].name}</b>
                <span className="text-sm text-muted">Latest</span>
                <Big value={latest ? Math.round(latest.score) : '-'} unit={scoreUnit(mode)} />
                <Sparkline values={modeTrend(mode)} />
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-[1.1fr_1fr_1fr] gap-4">
          <Card className="bg-surface shadow-soft">
            <span className="text-sm text-muted">Avg reaction time</span>
            <Big value={latestReaction ? Math.round(latestReaction) : '-'} unit="ms" />
            <span className="text-sm text-muted">
              {latestReaction && firstReaction && known.length > 1
                ? `${Math.round(firstReaction - latestReaction)} ms faster than ${WINDOW_DAYS} days ago`
                : 'Play a few days to see the trend'}
            </span>
            <ReactionBars
              bars={days.map((d, i) => ({ label: d.toLocaleDateString('en-IN', { weekday: 'short' }), value: reactionByDay[i] }))}
            />
          </Card>
          <Card className="bg-peach">
            <span className="text-sm text-muted">Mood vs reaction time</span>
            <h2 className="mt-1 text-xl font-bold">Does mood move the hand?</h2>
            <MoodScatter points={moodPoints} />
            <span className="text-sm text-muted">Mood 1 to 5 · higher dots are faster</span>
          </Card>
          <Card className="flex flex-col bg-ink text-white">
            <span className="text-sm text-white/70">Next session</span>
            <Big value={config ? clockTime(config.session_time) : '-'} light />
            <span className="text-sm text-white/70">
              {config
                ? `Reminder call goes out at ${minutesBefore(config.session_time, config.reminder_minutes_before)}`
                : ''}
            </span>
            <button
              onClick={startCall}
              disabled={call.kind === 'calling'}
              className="mt-auto self-start rounded-full bg-surface px-6 py-4 font-bold text-ink transition active:scale-[.97] disabled:opacity-60"
            >
              {call.kind === 'calling' ? 'Calling...' : 'Call now'}
            </button>
            {call.kind === 'ok' && <span className="mt-2 text-sm text-mint">Call started. The phone should ring now.</span>}
            {call.kind === 'error' && <span className="mt-2 text-sm text-peach">Call failed: {call.message}</span>}
          </Card>
        </div>

        <Card className="bg-surface shadow-soft">
          <h2 className="text-xl font-bold">Session history</h2>
          <table className="mt-2 w-full text-[15px]">
            <thead>
              <tr className="text-left text-[13px] text-muted">
                {['Game', 'When', 'Hand', 'Score', 'Reaction', 'Mood'].map((h) => (
                  <th key={h} className="py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-muted">
              {sessions.slice(0, HISTORY_ROWS).map((s) => (
                <tr key={s.id} className="border-t border-line">
                  <td className="py-2.5 font-bold text-ink">{MODES[s.mode].name}</td>
                  <td>{whenText(s.started_at)}</td>
                  <td className="capitalize">{s.hand}</td>
                  <td className="num">{Math.round(s.score)} {scoreUnit(s.mode)}</td>
                  <td className="num">{s.avg_reaction_ms > 0 ? `${Math.round(s.avg_reaction_ms)} ms` : '-'}</td>
                  <td className="num">{s.mood ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
