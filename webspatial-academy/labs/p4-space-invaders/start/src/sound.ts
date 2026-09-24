// Every sound is synthesized with WebAudio: no audio files, nothing copyrighted.
// The AudioContext is created on the first user gesture (browsers block audio before one).

let ctx: AudioContext | null = null
let muted = false

function ac(): AudioContext | null {
  if (muted) return null
  if (!ctx) {
    try {
      ctx = new AudioContext()
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, to: number, dur: number, type: OscillatorType, vol = 0.08) {
  const a = ac()
  if (!a) return
  const t = a.currentTime
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur)
  gain.gain.setValueAtTime(vol, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain).connect(a.destination)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

function noise(dur: number, vol = 0.12, cutoff = 1800) {
  const a = ac()
  if (!a) return
  const t = a.currentTime
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = a.createBufferSource()
  const filter = a.createBiquadFilter()
  const gain = a.createGain()
  src.buffer = buf
  filter.type = 'lowpass'
  filter.frequency.value = cutoff
  gain.gain.setValueAtTime(vol, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(filter).connect(gain).connect(a.destination)
  src.start(t)
}

const MARCH = [98, 87, 78, 73] // a four-note descending bass loop

export const sfx = {
  unlock: () => void ac(),
  shoot: () => tone(880, 220, 0.12, 'square', 0.05),
  hit: () => noise(0.18, 0.14, 2400),
  march: (step: number) => tone(MARCH[step % MARCH.length], MARCH[step % MARCH.length] * 0.9, 0.09, 'square', 0.07),
  ufo: () => tone(420, 760, 0.35, 'sawtooth', 0.04),
  ufoHit: () => tone(1200, 90, 0.5, 'triangle', 0.1),
  playerHit: () => noise(0.6, 0.2, 700),
  wave: () => tone(330, 990, 0.4, 'triangle', 0.08),
  gameOver: () => tone(300, 60, 1.2, 'sawtooth', 0.08),
  toggleMute: () => (muted = !muted),
  isMuted: () => muted,
}
