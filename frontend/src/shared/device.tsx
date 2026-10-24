import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { ALL_PADS, HOLD_MS, PALM_PAD, RECONNECT_MS, WS_URL } from './config'
import type { DeviceEvent, Hand } from './types'

type Listener = (event: DeviceEvent) => void
type Device = { hand: Hand; connected: boolean; subscribe: (listener: Listener) => () => void }

const DeviceContext = createContext<Device | null>(null)

// One socket for the whole app. Taps come from the board through the backend,
// or from keys 1-6 when no board is around.
export function DeviceProvider({ children }: { children: ReactNode }) {
  const listeners = useRef(new Set<Listener>())
  const handRef = useRef<Hand>('right')
  const [hand, setHand] = useState<Hand>('right')
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const emit = (event: DeviceEvent) => {
      handRef.current = event.hand
      setHand(event.hand)
      listeners.current.forEach((listener) => listener(event))
    }

    let socket: WebSocket | null = null
    let retry: number | undefined
    let closed = false
    const connect = () => {
      socket = new WebSocket(WS_URL)
      socket.onopen = () => setConnected(true)
      socket.onmessage = (msg) => emit(JSON.parse(msg.data) as DeviceEvent)
      socket.onclose = () => {
        setConnected(false)
        if (!closed) retry = window.setTimeout(connect, RECONNECT_MS)
      }
    }
    connect()

    let holdTimer: number | undefined
    const fromKey = (type: DeviceEvent['type'], pad: number) =>
      emit({ type, pad, hand: handRef.current, ms: Math.round(performance.now()) })
    const onDown = (e: KeyboardEvent) => {
      const pad = Number(e.key)
      if (e.repeat || !ALL_PADS.includes(pad)) return
      fromKey('tap', pad)
      if (pad === PALM_PAD) holdTimer = window.setTimeout(() => fromKey('hold', PALM_PAD), HOLD_MS)
    }
    const onUp = (e: KeyboardEvent) => {
      if (Number(e.key) === PALM_PAD) window.clearTimeout(holdTimer)
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)

    return () => {
      closed = true
      window.clearTimeout(retry)
      window.clearTimeout(holdTimer)
      socket?.close()
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  const subscribe = useCallback((listener: Listener) => {
    listeners.current.add(listener)
    return () => {
      listeners.current.delete(listener)
    }
  }, [])

  return <DeviceContext.Provider value={{ hand, connected, subscribe }}>{children}</DeviceContext.Provider>
}

export function useDevice() {
  const device = useContext(DeviceContext)
  if (!device) throw new Error('useDevice needs a DeviceProvider')
  return device
}

// Calls the latest handler on every tap or hold while the component is mounted.
export function useDeviceEvents(handler: Listener) {
  const { subscribe } = useDevice()
  const latest = useRef(handler)
  useEffect(() => {
    latest.current = handler
  })
  useEffect(() => subscribe((event) => latest.current(event)), [subscribe])
}
