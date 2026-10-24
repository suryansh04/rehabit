import { useEffect, useRef } from 'react'
import { ALL_PADS, HOLD_MS, PALM_PAD, RECONNECT_MS, WS_URL } from './config'
import type { DeviceEvent, Hand } from './types'

// Taps come from the board over the backend, or from keys 1-6 when no board is around.
export function useDeviceSocket(onEvent: (event: DeviceEvent) => void) {
  const handler = useRef(onEvent)
  const lastHand = useRef<Hand>('right')

  useEffect(() => {
    handler.current = onEvent
  })

  useEffect(() => {
    let socket: WebSocket | null = null
    let retry: number | undefined
    let closed = false

    const connect = () => {
      socket = new WebSocket(WS_URL)
      socket.onmessage = (msg) => {
        const event = JSON.parse(msg.data) as DeviceEvent
        lastHand.current = event.hand
        handler.current(event)
      }
      socket.onclose = () => {
        if (!closed) retry = window.setTimeout(connect, RECONNECT_MS)
      }
    }
    connect()

    return () => {
      closed = true
      window.clearTimeout(retry)
      socket?.close()
    }
  }, [])

  useEffect(() => {
    let holdTimer: number | undefined
    const emit = (type: DeviceEvent['type'], pad: number) =>
      handler.current({ type, pad, hand: lastHand.current, ms: Math.round(performance.now()) })

    const onDown = (e: KeyboardEvent) => {
      const pad = Number(e.key)
      if (e.repeat || !ALL_PADS.includes(pad)) return
      emit('tap', pad)
      if (pad === PALM_PAD) holdTimer = window.setTimeout(() => emit('hold', PALM_PAD), HOLD_MS)
    }
    const onUp = (e: KeyboardEvent) => {
      if (Number(e.key) === PALM_PAD) window.clearTimeout(holdTimer)
    }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.clearTimeout(holdTimer)
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])
}
