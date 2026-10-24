import { useEffect, useState } from 'react'
import { getConfig, getSessions, saveSession } from '../shared/api'
import { DeviceProvider } from '../shared/device'
import { clockTime, firstName, streakDays } from '../shared/stats'
import type { ModeId, PublicConfig, SessionResult } from '../shared/types'
import { DoneScreen } from './DoneScreen'
import { GameScreen } from './GameScreen'
import { MenuScreen } from './MenuScreen'
import { MoodScreen } from './MoodScreen'
import { TalkScreen } from './TalkScreen'

type Screen =
  | { name: 'menu' }
  | { name: 'game'; run: number }
  | { name: 'done'; result: SessionResult; saveError: string | null }
  | { name: 'talk' }
  | { name: 'mood' }

export function PlayPage() {
  const [screen, setScreen] = useState<Screen>({ name: 'menu' })
  const [mode, setMode] = useState<ModeId>('classic')
  const [config, setConfig] = useState<PublicConfig | null>(null)
  const [streak, setStreak] = useState(0)

  const refreshStreak = () => getSessions().then((sessions) => setStreak(streakDays(sessions)))

  useEffect(() => {
    getConfig().then(setConfig)
    refreshStreak()
  }, [])

  const menu = () => setScreen({ name: 'menu' })
  // run changes on every start, so Play again mounts a brand new game
  const start = () => setScreen({ name: 'game', run: Date.now() })

  const finish = async (result: SessionResult) => {
    try {
      await saveSession(result)
      await refreshStreak()
      setScreen({ name: 'done', result, saveError: null })
    } catch (e) {
      setScreen({ name: 'done', result, saveError: e instanceof Error ? e.message : String(e) })
    }
  }

  return (
    <DeviceProvider>
      {screen.name === 'menu' && (
        <MenuScreen
          name={firstName(config?.patient_name ?? '')}
          sessionTime={clockTime(config?.session_time ?? '')}
          streak={streak}
          mode={mode}
          onPick={setMode}
          onStart={start}
          onTalk={() => setScreen({ name: 'talk' })}
        />
      )}
      {screen.name === 'game' && <GameScreen key={screen.run} mode={mode} onFinish={finish} onStop={menu} />}
      {screen.name === 'done' && (
        <DoneScreen result={screen.result} streak={streak} saveError={screen.saveError} onAgain={start} onMenu={menu} />
      )}
      {screen.name === 'talk' && <TalkScreen config={config} onEnd={() => setScreen({ name: 'mood' })} />}
      {screen.name === 'mood' && <MoodScreen onDone={menu} />}
    </DeviceProvider>
  )
}
