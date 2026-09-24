import { useEffect, useState } from 'react'
import { createBus } from './bus'
import { loadScores, type ScoreRow } from './scores'

/** Opens by itself when a game ends. Reads localStorage, and refreshes on each 'gameover'. */
export function HallOfFame() {
  const [rows, setRows] = useState<ScoreRow[]>(loadScores)

  useEffect(() => {
    const bus = createBus((msg) => {
      if (msg.type === 'gameover') setRows(loadScores())
    })
    return () => bus.close()
  }, [])

  // This window usually opens just AFTER the game ended, so it reads the saved scores and
  // highlights the newest one; later game-overs arrive on the bus.
  const newest = Math.max(0, ...rows.map((r) => r.at))

  return (
    <main className="hud pico-panel">
      <p className="pico-eyebrow">Spatial Invaders</p>
      <h1 className="pico-display fame-title">Hall of fame</h1>
      {rows.length === 0 ? (
        <p className="hud-wait">No games finished yet.</p>
      ) : (
        <ol className="fame">
          {rows.map((r, i) => (
            <li key={r.at} className={r.at === newest ? 'fresh' : ''}>
              <span className="fame-rank">{i + 1}</span>
              <span className="fame-score">{r.score}</span>
              <span className="fame-wave">wave {r.wave}</span>
            </li>
          ))}
        </ol>
      )}
    </main>
  )
}
