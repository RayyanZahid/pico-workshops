// Cross-scene bus. The game, the HUD and the hall of fame are separate documents (separate
// windows), so they share nothing in memory. BroadcastChannel is a plain web API that works
// across same-origin windows. The game is authoritative; the other scenes display and send
// intents back.

export type HudState = {
  score: number
  lives: number
  wave: number
  status: 'ready' | 'playing' | 'paused' | 'over'
}

export type Msg =
  | { type: 'hello' }
  | { type: 'state'; state: HudState }
  | { type: 'gameover'; score: number; wave: number }
  | { type: 'intent'; action: 'pause' | 'restart' }

export function createBus(onMessage: (msg: Msg) => void) {
  const ch = new BroadcastChannel('invaders')
  ch.onmessage = (e: MessageEvent<Msg>) => onMessage(e.data)
  return {
    post: (msg: Msg) => ch.postMessage(msg),
    close: () => {
      ch.onmessage = null
      ch.close()
    },
  }
}
