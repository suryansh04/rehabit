import { useState } from 'react'
import { HandBoard } from '../shared/HandBoard'
import { Ring } from '../shared/Ring'
import { useDeviceSocket } from '../shared/useDeviceSocket'
import type { DeviceEvent } from '../shared/types'

export function PlayPage() {
  const [last, setLast] = useState<DeviceEvent | null>(null)
  useDeviceSocket(setLast)

  return (
    <main className="grid min-h-screen place-items-center">
      <Ring lit={last?.pad ?? 0} total={20} size={560}>
        <HandBoard hand={last?.hand ?? 'right'} size={320} live={last?.pad} />
      </Ring>
      <p className="text-muted">{last ? `${last.type} pad ${last.pad} (${last.hand})` : 'Waiting for a tap'}</p>
    </main>
  )
}
