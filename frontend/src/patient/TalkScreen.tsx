import { HandBoard } from '../shared/HandBoard'
import { Ring } from '../shared/Ring'
import { Pill, TopBar } from '../shared/TopBar'
import { PALM_PAD, TAPS_PER_GAME } from '../shared/config'
import { useDevice } from '../shared/device'
import { Bubble, Button } from '../shared/ui'

export function TalkScreen({ onEnd }: { onEnd: () => void }) {
  const { hand } = useDevice()

  return (
    <div className="flex min-h-screen flex-col gap-6 px-10 py-8">
      <TopBar left={<Pill><b>Talk time</b></Pill>} right={<Button small onClick={onEnd}>End talk</Button>} />
      <main className="grid flex-1 grid-cols-[auto_1fr] items-center gap-12">
        <Ring lit={0} total={TAPS_PER_GAME} size={560} showTicks={false}>
          <HandBoard hand={hand} size={320} live={PALM_PAD} />
        </Ring>
        <div className="flex max-w-lg flex-col gap-3.5">
          <h1 className="text-[34px] font-bold tracking-tight">We are listening.</h1>
          <p className="text-muted">Speak in Hindi or English. Take your time.</p>
          <Bubble text="Aaj aapka din kaisa raha?" from="Your companion" />
        </div>
      </main>
    </div>
  )
}
