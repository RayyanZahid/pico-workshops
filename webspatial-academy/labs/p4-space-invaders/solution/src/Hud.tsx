import { useEffect, useRef, useState } from 'react'
import { createBus, type HudState } from './bus'

/** The HUD window: a pure display. It owns no game state; it asks, listens and sends intents. */
export function Hud() {
  const [state, setState] = useState<HudState | null>(null)
  const [final, setFinal] = useState<number | null>(null)
  const busRef = useRef<ReturnType<typeof createBus> | null>(null)

  useEffect(() => {
    const bus = createBus((msg) => {
      if (msg.type === 'state') {
        setState(msg.state)
        if (msg.state.status !== 'over') setFinal(null)
      }
      if (msg.type === 'gameover') setFinal(msg.score)
    })
    busRef.current = bus
    // Late-join handshake: we missed every earlier broadcast, so ask for the current state.
    bus.post({ type: 'hello' })
    return () => bus.close()
  }, [])

  const send = (action: 'pause' | 'restart') => busRef.current?.post({ type: 'intent', action })

  return (
    <main className="hud pico-panel">
      <p className="pico-eyebrow">Spatial Invaders · HUD</p>
      {state ? (
        <>
          <div className="hud-score">{state.score}</div>
          <dl className="hud-grid">
            <div>
              <dt>Lives</dt>
              <dd className="hud-lives">{'▲'.repeat(Math.max(0, state.lives)) || '0'}</dd>
            </div>
            <div>
              <dt>Wave</dt>
              <dd>{state.wave}</dd>
            </div>
          </dl>
          <span className={`pico-chip ${chip(state.status)}`}>{state.status}</span>
          {final !== null && <p className="hud-final">Game over · final score {final}</p>}
          <div className="hud-actions">
            <button className="pico-btn pico-btn--ghost" type="button" onClick={() => send('pause')}>
              Pause / resume
            </button>
            <button className="pico-btn" type="button" onClick={() => send('restart')}>
              Restart
            </button>
          </div>
        </>
      ) : (
        <p className="hud-wait">Waiting for the game window…</p>
      )}
    </main>
  )
}

function chip(status: HudState['status']) {
  if (status === 'playing') return 'pico-chip--ok'
  if (status === 'over') return 'pico-chip--danger'
  return 'pico-chip--warn'
}
