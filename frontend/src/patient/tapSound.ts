// A soft two-note chime for a correct tap, made in the browser so we ship no sound file.
const NOTES_HZ = [880, 1320]
const NOTE_GAP_S = 0.045
const VOLUME = 0.12
const ATTACK_S = 0.01
const FADE_S = 0.35
const SILENT = 0.0001

let shared: AudioContext | null = null

export function playHitSound() {
  shared ??= new AudioContext()
  const audio = shared
  NOTES_HZ.forEach((hz, i) => {
    const start = audio.currentTime + i * NOTE_GAP_S
    const tone = audio.createOscillator()
    const level = audio.createGain()
    tone.type = 'sine'
    tone.frequency.value = hz
    // a quick soft attack, then a long gentle fade, so it sounds like a bell and not a beep
    level.gain.setValueAtTime(0, start)
    level.gain.linearRampToValueAtTime(VOLUME, start + ATTACK_S)
    level.gain.exponentialRampToValueAtTime(SILENT, start + FADE_S)
    tone.connect(level).connect(audio.destination)
    tone.start(start)
    tone.stop(start + FADE_S)
  })
}
