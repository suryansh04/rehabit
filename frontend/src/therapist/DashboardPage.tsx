import {
  BellRing,
  Gamepad2,
  LayoutGrid,
  ListChecks,
  MessageCircle,
  Phone,
  Settings,
  Smile,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { MODE_ORDER, MODES } from '../patient/games/modes'
import { Logo, Pill } from '../shared/TopBar'
import { callNow, getConfig, getSessions } from '../shared/api'
import { average, clockTime, dayKey, lastDays, moodLabel, scoreUnit, streakDays, whenText } from '../shared/stats'
import type { ModeId, PublicConfig, Session } from '../shared/types'
import { MsBars, Sparkline } from './charts'

const WINDOW_DAYS = 7
const HISTORY_ROWS = 8
const MOOD_LEVELS = [1, 2, 3, 4, 5]
const LOW_MOOD_MAX = 2

const NAV: [string, LucideIcon][] = [
  ['Overview', LayoutGrid],
  ['Sessions', ListChecks],
  ['Games', Gamepad2],
  ['Mood', Smile],
  ['Calls', Phone],
  ['Settings', Settings],
]

type CallState = { kind: 'idle' } | { kind: 'calling' } | { kind: 'ok' } | { kind: 'error'; message: string }

function Card({ className = 'bg-surface shadow-soft', children }: { className?: string; children: ReactNode }) {
  return <section className={`rounded-card p-6 ${className}`}>{children}</section>
}

function Big({ value, unit, light = false }: { value: string | number; unit?: string; light?: boolean }) {
  return (
    <span className="num my-1 block text-[38px] font-bold leading-none tracking-tight">
      {value}
      {unit && <small className={`ml-1 text-lg font-medium ${light ? 'text-white/70' : 'text-muted'}`}>{unit}</small>}
    </span>
  )
}

function Kpi({ label, value, unit, note }: { label: string; value: string | number; unit?: string; note: string }) {
  return (
    <Card>
      <span className="text-sm text-muted">{label}</span>
      <Big value={value} unit={unit} />
      <span className="text-sm text-muted">{note}</span>
    </Card>
  )
}

function byDay(sessions: Session[], days: Date[], pick: (rows: Session[]) => number) {
  return days.map((day) => {
    const rows = sessions.filter((s) => s.started_at.startsWith(dayKey(day)))
    return rows.length ? pick(rows) : null
  })
}

function shiftClock(hhmm: string, minutes: number) {
  const [h, m] = hhmm.split(':').map(Number)
  const total = h * 60 + m + minutes
  return clockTime(`${Math.floor(total / 60)}:${total % 60}`)
}

function weekday(day: Date) {
  return day.toLocaleDateString('en-IN', { weekday: 'short' })
}

// "+12 % since Mon" for a score where higher is better.
function changeText(values: (number | null)[], days: Date[], unit: string) {
  const known = values.flatMap((v, i) => (v === null ? [] : [{ v, day: days[i] }]))
  if (known.length < 2) return 'One game so far this week'
  const diff = Math.round(known[known.length - 1].v - known[0].v)
  return `${diff >= 0 ? '+' : ''}${diff} ${unit} since ${weekday(known[0].day)}`
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
  const week = sessions.filter((s) => s.started_at >= dayKey(days[0]))
  // a game with no good taps has no reaction time, so it must not pull the averages down
  const timed = week.filter((s) => s.avg_reaction_ms > 0)
  const reactionByDay = byDay(timed, days, (rows) => average(rows.map((s) => s.avg_reaction_ms)))
  const known = reactionByDay.flatMap((v, i) => (v === null ? [] : [{ v, i }]))
  const latest = known.at(-1)
  const first = known[0]
  const reactionChange = latest && first && latest.i !== first.i ? Math.round(first.v - latest.v) : null

  const moods = week.filter((s) => s.mood !== null).map((s) => s.mood as number)
  const moodBars = MOOD_LEVELS.map((level) => {
    const rows = timed.filter((s) => s.mood === level)
    return {
      label: String(level),
      value: rows.length ? average(rows.map((s) => s.avg_reaction_ms)) : null,
      note: `${rows.length} ${rows.length === 1 ? 'game' : 'games'}`,
    }
  })
  const fastestMood = moodBars.reduce((best, bar, i) => (bar.value !== null && (best < 0 || bar.value < (moodBars[best].value ?? Infinity)) ? i : best), -1)
  const lowRows = timed.filter((s) => s.mood !== null && s.mood <= LOW_MOOD_MAX)
  const goodRows = timed.filter((s) => s.mood !== null && s.mood > LOW_MOOD_MAX + 1)
  const moodGap =
    lowRows.length && goodRows.length
      ? Math.round(average(lowRows.map((s) => s.avg_reaction_ms)) - average(goodRows.map((s) => s.avg_reaction_ms)))
      : null

  const modeTrend = (mode: ModeId) =>
    byDay(week.filter((s) => s.mode === mode), days, (rows) => average(rows.map((s) => s.score)))
  const latestOf = (mode: ModeId) => sessions.find((s) => s.mode === mode)

  const plan = config && [
    { icon: Phone, time: shiftClock(config.session_time, -config.reminder_minutes_before), text: 'Rehab AI calls with a reminder' },
    { icon: Gamepad2, time: clockTime(config.session_time), text: 'Game session on the board' },
    { icon: BellRing, time: shiftClock(config.session_time, config.missed_after_minutes), text: 'Family alert if no game yet' },
    { icon: MessageCircle, time: clockTime(config.daily_summary_time), text: 'Daily summary on WhatsApp' },
  ]

  return (
    <div className="flex min-h-screen gap-5 p-5">
      <nav className="sticky top-5 flex h-[calc(100vh-40px)] w-64 shrink-0 flex-col gap-1.5 rounded-card bg-surface px-5 py-7 shadow-soft">
        <div className="px-3 pb-6">
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
      </nav>

      <div className="flex min-w-0 flex-1 flex-col gap-4 pt-1.5">
        <header className="flex items-center gap-4">
          {config && (
            <span className="grid size-12 place-items-center rounded-2xl bg-lilac text-lg font-bold text-accent-ink">
              {config.patient_name.split(' ').map((w) => w[0]).join('')}
            </span>
          )}
          <div>
            <h1 className="text-[28px] font-bold leading-tight tracking-tight">{config?.patient_name ?? 'Overview'}</h1>
            <p className="text-muted">
              {sessions[0] ? `${sessions[0].hand === 'left' ? 'Left' : 'Right'} hand · ` : ''}
              Last game {sessions[0] ? whenText(sessions[0].started_at) : 'not played yet'}
            </p>
          </div>
          <span className="ml-auto">
            <Pill>Last {WINDOW_DAYS} days</Pill>
          </span>
        </header>
        {error && <p className="text-error">We could not load the sessions: {error}</p>}

        <div className="grid grid-cols-4 gap-4">
          <Kpi label="Games played" value={week.length} note={`on ${new Set(week.map((s) => s.started_at.slice(0, 10))).size} of ${WINDOW_DAYS} days`} />
          <Kpi label="Streak" value={streakDays(sessions)} unit="days" note="days in a row with a game" />
          <Kpi label="Accuracy" value={week.length ? Math.round(average(week.map((s) => s.accuracy))) : '-'} unit="%" note="good taps out of all taps" />
          <Kpi
            label="Mood"
            value={moods.length ? average(moods).toFixed(1) : '-'}
            unit="/ 5"
            note={moods.length ? `mostly ${moodLabel(average(moods)).toLowerCase()}` : 'no mood yet this week'}
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          {MODE_ORDER.map((mode) => {
            const latestGame = latestOf(mode)
            const trend = modeTrend(mode)
            return (
              <Card key={mode}>
                <b className="block">{MODES[mode].name}</b>
                <Big value={latestGame ? Math.round(latestGame.score) : '-'} unit={scoreUnit(mode)} />
                <span className="text-sm text-muted">{changeText(trend, days, scoreUnit(mode))}</span>
                <div className="mt-3">
                  <Sparkline values={trend.filter((v): v is number => v !== null)} />
                </div>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-[1.15fr_1fr_1fr] gap-4">
          <Card>
            <span className="text-sm text-muted">Reaction time · lower is better</span>
            <Big value={latest ? Math.round(latest.v) : '-'} unit="ms" />
            <span className="text-sm text-muted">
              {reactionChange === null
                ? 'Play a few days to see the trend'
                : `${Math.abs(reactionChange)} ms ${reactionChange >= 0 ? 'faster' : 'slower'} than ${weekday(days[first.i])}`}
            </span>
            <div className="mt-3">
              <MsBars bars={days.map((d, i) => ({ label: weekday(d), value: reactionByDay[i] }))} highlight={latest?.i ?? -1} />
            </div>
          </Card>

          <Card className="bg-peach">
            <span className="text-sm text-muted">Reaction time by mood</span>
            <h2 className="mt-1 text-xl font-bold leading-snug">
              {moodGap === null
                ? 'Does mood move the hand?'
                : moodGap > 0
                  ? `${moodGap} ms faster on good-mood days`
                  : `Mood did not slow the hand this week`}
            </h2>
            <div className="mt-3">
              <MsBars bars={moodBars} highlight={fastestMood} width={250} height={150} />
            </div>
            <span className="text-sm text-muted">Mood 1 (very low) to 5 (very good)</span>
          </Card>

          <Card className="flex flex-col bg-ink text-white">
            <span className="text-sm text-white/70">Next session</span>
            <Big value={config ? clockTime(config.session_time) : '-'} light />
            <ul className="mt-3 flex flex-col gap-2.5">
              {plan?.map(({ icon: Icon, time, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm">
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/10">
                    <Icon size={16} />
                  </span>
                  <span className="num w-[68px] shrink-0 font-bold">{time}</span>
                  <span className="text-white/75">{text}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={startCall}
              disabled={call.kind === 'calling'}
              className="mt-auto flex items-center gap-2 self-start rounded-full bg-surface px-6 py-3.5 font-bold text-ink transition active:scale-[.97] disabled:opacity-60"
            >
              <Phone size={18} />
              {call.kind === 'calling' ? 'Calling...' : 'Call now'}
            </button>
            {call.kind === 'ok' && <span className="mt-2 text-sm text-mint">Call started. The phone should ring now.</span>}
            {call.kind === 'error' && <span className="mt-2 text-sm text-peach">Call failed: {call.message}</span>}
          </Card>
        </div>

        <Card>
          <h2 className="text-xl font-bold">Session history</h2>
          <table className="mt-2 w-full text-[15px]">
            <thead>
              <tr className="text-left text-[13px] text-muted">
                {['Game', 'When', 'Hand', 'Score', 'Accuracy', 'Reaction', 'Mood'].map((h) => (
                  <th key={h} className="py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-muted">
              {sessions.slice(0, HISTORY_ROWS).map((s) => (
                <tr key={s.id} className="border-t border-line">
                  <td className="py-3 font-bold text-ink">{MODES[s.mode].name}</td>
                  <td>{whenText(s.started_at)}</td>
                  <td className="capitalize">{s.hand}</td>
                  <td className="num">{Math.round(s.score)} {scoreUnit(s.mode)}</td>
                  <td className="num">{Math.round(s.accuracy)} %</td>
                  <td className="num">{s.avg_reaction_ms > 0 ? `${Math.round(s.avg_reaction_ms)} ms` : '-'}</td>
                  <td>
                    {s.mood === null ? (
                      '-'
                    ) : (
                      <span
                        className={`rounded-full px-2.5 py-1 text-[13px] font-bold ${
                          s.mood <= LOW_MOOD_MAX ? 'bg-peach text-error' : 'bg-mint text-ink'
                        }`}
                      >
                        {s.mood} · {moodLabel(s.mood)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
