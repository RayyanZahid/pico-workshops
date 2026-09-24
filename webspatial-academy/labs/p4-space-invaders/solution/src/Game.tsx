import { useCallback, useEffect, useRef, useState } from 'react'
import * as C from './constants'
import { sfx } from './sound'
import { OVERLAY_Z, POP, POP_DECAY, SHIELD_Z, SHIP_Z, formationZ, lerp, rowWorldZ, rowZ, writeBack } from './depth' // SPATIAL
import { createBus, type HudState } from './bus' // SPATIAL
import { saveScore } from './scores' // SPATIAL
import { openScene } from './scenes' // SPATIAL

// SPATIAL: lines marked SPATIAL are the whole spatial layer; start/ is this file without them.

type Sprite = { active: boolean; x: number; y: number; z0: number }
type Status = 'ready' | 'playing' | 'paused' | 'over'
type Hud = { score: number; lives: number; wave: number; status: Status }

type World = {
  fx: number
  fy: number
  dir: 1 | -1
  alive: number[][] // 1 alive, 0 gone
  dying: { r: number; c: number; until: number }[]
  killed: number
  shipX: number
  invulnerable: number
  shots: Sprite[]
  bombs: Sprite[]
  cooldown: number
  bombTimer: number
  shields: boolean[][][]
  ufo: { active: boolean; x: number; dir: 1 | -1; points: number }
  ufoTimer: number
  marchTimer: number
  marchStep: number
  pops: number[] // per-row depth flinch, decays to 0
  hud: Hud
}

const pool = (n: number): Sprite[] => Array.from({ length: n }, () => ({ active: false, x: 0, y: 0, z0: 0 }))

function newWorld(wave = 1, score = 0, lives = C.LIVES, status: Status = 'ready', shields?: boolean[][][]): World {
  return {
    fx: (C.W - C.FORMATION_W) / 2,
    fy: C.START_Y + Math.min(wave - 1, 4) * 14,
    dir: 1,
    alive: Array.from({ length: C.ROWS }, () => Array.from({ length: C.COLS }, () => 1)),
    dying: [],
    killed: 0,
    shipX: C.W / 2,
    invulnerable: 0,
    shots: pool(C.SHOT_POOL),
    bombs: pool(C.BOMB_POOL),
    cooldown: 0,
    bombTimer: 1.5,
    shields: shields ?? Array.from({ length: C.SHIELDS }, C.shieldShape),
    ufo: { active: false, x: 0, dir: 1, points: 0 },
    ufoTimer: 12 + Math.random() * 10,
    marchTimer: 0,
    marchStep: 0,
    pops: Array.from({ length: C.ROWS }, () => 0),
    hud: { score, lives, wave, status },
  }
}

// Write a style only when its value changes. The loop runs 60 times a second, and in the
// headset a style write on a spatial element is sent on to the native runtime.
const lastStyle = new WeakMap<HTMLElement, Record<string, string>>()
const setStyle = (el: HTMLElement | null, prop: 'transform' | 'visibility', value: string) => {
  if (!el) return
  const cache = lastStyle.get(el) ?? {}
  if (cache[prop] === value) return
  cache[prop] = value
  lastStyle.set(el, cache)
  el.style[prop] = value
}
const place = (el: HTMLElement | null, x: number, y: number) =>
  setStyle(el, 'transform', `translate(${Math.round(x)}px, ${Math.round(y)}px)`)
const show = (el: HTMLElement | null, on: boolean) => setStyle(el, 'visibility', on ? 'visible' : 'hidden')
const overlaps = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) =>
  ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by

/** Knock out the shield block under (x, y), if any. Returns true if something was hit. */
function hitShield(shields: boolean[][][], x: number, y: number) {
  for (let s = 0; s < C.SHIELDS; s++) {
    const c = Math.floor((x - C.SHIELD_X[s]) / C.BLOCK)
    const r = Math.floor((y - C.SHIELD_Y) / C.BLOCK)
    if (c >= 0 && c < C.SH_COLS && r >= 0 && r < C.SH_ROWS && shields[s][r][c]) {
      shields[s][r][c] = false
      return true
    }
  }
  return false
}

// SPATIAL {
/** The bottom-most row that still has an invader: the depth a player shot flies toward. */
function frontRow(alive: number[][]) {
  for (let r = C.ROWS - 1; r >= 0; r--) if (alive[r].some(Boolean)) return r
  return 0
}
// SPATIAL }

export function Game() {
  const world = useRef<World>(newWorld())
  const keys = useRef({ left: false, right: false, fire: false })
  const [hud, setHud] = useState<Hud>(world.current.hud)
  const [, redraw] = useState(0) // bump when invaders or shield blocks disappear
  const [muted, setMuted] = useState(sfx.isMuted())

  // Refs to everything the loop moves, so 60 fps updates never re-render React.
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])
  const shipRef = useRef<HTMLDivElement>(null)
  const shieldsRef = useRef<HTMLDivElement>(null)
  const ufoRef = useRef<HTMLDivElement>(null)
  const shotRefs = useRef<(HTMLDivElement | null)[]>([])
  const bombRefs = useRef<(HTMLDivElement | null)[]>([])
  const overlayRef = useRef<HTMLDivElement>(null) // SPATIAL

  const commitHud = useCallback((patch: Partial<Hud>) => {
    const w = world.current
    w.hud = { ...w.hud, ...patch }
    setHud(w.hud)
  }, [])

  const busRef = useRef<ReturnType<typeof createBus> | null>(null) // SPATIAL

  const gameOver = useCallback(() => {
    commitHud({ status: 'over' })
    sfx.gameOver()
    // SPATIAL {
    const w = world.current
    saveScore(w.hud.score, w.hud.wave)
    busRef.current?.post({ type: 'gameover', score: w.hud.score, wave: w.hud.wave })
    // GOTCHA: open the new window on a LATER task. In Chrome, a BroadcastChannel message
    // posted in the same task that opens a brand-new window was dropped for the windows
    // already listening (measured 2026-09-24), so the HUD never heard 'gameover'.
    window.setTimeout(() => openScene('halloffame'), 100)
    // SPATIAL }
  }, [commitHud])

  const restart = useCallback(() => {
    sfx.unlock()
    world.current = newWorld(1, 0, C.LIVES, 'playing')
    setHud(world.current.hud)
    redraw((n) => n + 1)
  }, [])

  const togglePause = useCallback(() => {
    const s = world.current.hud.status
    if (s === 'playing') commitHud({ status: 'paused' })
    else if (s === 'paused') commitHud({ status: 'playing' })
  }, [commitHud])

  const primary = useCallback(() => {
    sfx.unlock()
    const s = world.current.hud.status
    if (s === 'ready') commitHud({ status: 'playing' })
    else if (s === 'over') restart()
    else togglePause()
  }, [commitHud, restart, togglePause])

  const fire = useCallback(() => {
    const w = world.current
    if (w.hud.status !== 'playing' || w.cooldown > 0) return
    const s = w.shots.find((x) => !x.active)
    if (!s) return
    s.active = true
    s.x = w.shipX - C.SHOT_W / 2
    s.y = C.SHIP_Y - C.SHOT_H
    w.cooldown = C.FIRE_COOLDOWN
    sfx.shoot()
  }, [])

  const nudge = useCallback((dir: -1 | 1) => {
    const w = world.current
    w.shipX = Math.min(C.W - C.SHIP_W / 2, Math.max(C.SHIP_W / 2, w.shipX + dir * C.NUDGE))
  }, [])

  // SPATIAL {
  // ---------- HUD window sync ----------
  useEffect(() => {
    const bus = createBus((msg) => {
      // Late-join handshake: a HUD opened mid-game asks for the current state.
      if (msg.type === 'hello') bus.post({ type: 'state', state: world.current.hud as HudState })
      if (msg.type === 'intent') {
        if (msg.action === 'pause') togglePause()
        else restart()
      }
    })
    busRef.current = bus
    return () => {
      bus.close()
      busRef.current = null
    }
  }, [togglePause, restart])

  // Broadcast HUD-level state when it changes, never per frame.
  useEffect(() => {
    busRef.current?.post({ type: 'state', state: hud as HudState })
  }, [hud])

  // Fixed depths: the ship, the shields and the buttons never move in Z.
  useEffect(() => {
    writeBack(shipRef.current, SHIP_Z)
    writeBack(shieldsRef.current, SHIELD_Z)
  }, [])
  useEffect(() => writeBack(overlayRef.current, OVERLAY_Z), [hud.status])
  // SPATIAL }

  // Test hook for the lab's automated check (dev builds only): end the game now.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    ;(window as unknown as { __invaders: object }).__invaders = { gameOver }
  }, [gameOver])

  // ---------- keyboard ----------
  useEffect(() => {
    const set = (e: KeyboardEvent, down: boolean) => {
      const k = e.key
      if (k === 'ArrowLeft' || k === 'a') keys.current.left = down
      else if (k === 'ArrowRight' || k === 'd') keys.current.right = down
      else if (k === ' ') keys.current.fire = down
      else if (down && k === 'Enter') primary()
      else if (down && k === 'p') togglePause()
      else if (down && k === 'm') setMuted(sfx.toggleMute())
      else return
      e.preventDefault()
    }
    const onDown = (e: KeyboardEvent) => set(e, true)
    const onUp = (e: KeyboardEvent) => set(e, false)
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [primary, togglePause])

  // ---------- the game loop ----------
  useEffect(() => {
    let raf = 0
    let last = performance.now()

    const update = (dt: number, now: number) => {
      const w = world.current
      const k = keys.current
      let changed = false

      // ship + fire
      const move = (k.right ? 1 : 0) - (k.left ? 1 : 0)
      w.shipX = Math.min(C.W - C.SHIP_W / 2, Math.max(C.SHIP_W / 2, w.shipX + move * C.SHIP_SPEED * dt))
      w.cooldown = Math.max(0, w.cooldown - dt)
      w.invulnerable = Math.max(0, w.invulnerable - dt)
      if (k.fire) fire()
      w.pops.forEach((p, r) => (w.pops[r] = p < 0.1 ? 0 : p * Math.pow(POP_DECAY, dt * 60))) // SPATIAL

      // invaders that were hit vanish after their flinch
      if (w.dying.length && w.dying[0].until <= now) {
        w.dying = w.dying.filter((d) => {
          if (d.until > now) return true
          w.alive[d.r][d.c] = 0
          changed = true
          return false
        })
      }

      // formation march: faster as it thins out and with every wave
      let minCol = C.COLS
      let maxCol = -1
      let bottom = -1
      for (let r = 0; r < C.ROWS; r++)
        for (let c = 0; c < C.COLS; c++)
          if (w.alive[r][c]) {
            minCol = Math.min(minCol, c)
            maxCol = Math.max(maxCol, c)
            bottom = Math.max(bottom, r)
          }
      const speed = 22 + w.killed * 1.7 + (w.hud.wave - 1) * 12
      w.fx += w.dir * speed * dt
      if ((w.dir > 0 && w.fx + maxCol * C.CELL_X + C.INV_W > C.W - 8) || (w.dir < 0 && w.fx + minCol * C.CELL_X < 8)) {
        w.dir = w.dir > 0 ? -1 : 1
        w.fy += C.DROP
      }
      w.marchTimer -= dt
      if (w.marchTimer <= 0) {
        w.marchTimer = Math.max(0.12, 0.8 - w.killed * 0.012 - (w.hud.wave - 1) * 0.06)
        sfx.march(w.marchStep++)
      }
      const formationBottom = w.fy + bottom * C.ROW_H + C.INV_H
      if (formationBottom >= C.SHIP_Y) return gameOver()
      // invaders that reach the shields chew through them
      if (formationBottom > C.SHIELD_Y) {
        for (let c = minCol; c <= maxCol; c++)
          for (let r = 0; r < C.ROWS; r++) {
            if (!w.alive[r][c]) continue
            const x = w.fx + c * C.CELL_X
            const y = w.fy + r * C.ROW_H
            for (let bx = x; bx < x + C.INV_W; bx += C.BLOCK)
              for (let by = y; by < y + C.INV_H; by += C.BLOCK) changed = hitShield(w.shields, bx, by) || changed
          }
      }

      // UFO
      w.ufoTimer -= dt
      if (!w.ufo.active && w.ufoTimer <= 0) {
        const dir = Math.random() < 0.5 ? 1 : -1
        w.ufo = { active: true, dir, x: dir > 0 ? -C.UFO_W : C.W, points: C.UFO_POINTS[Math.floor(Math.random() * 4)] }
        sfx.ufo()
      }
      if (w.ufo.active) {
        w.ufo.x += w.ufo.dir * C.UFO_SPEED * dt
        if (w.ufo.x < -C.UFO_W - 10 || w.ufo.x > C.W + 10) {
          w.ufo.active = false
          w.ufoTimer = 15 + Math.random() * 12
        }
      }

      // player shots (collisions are plain 2D rectangles)
      for (const s of w.shots) {
        if (!s.active) continue
        s.y -= C.SHOT_SPEED * dt
        if (s.y + C.SHOT_H < 0) {
          s.active = false
          continue
        }
        if (hitShield(w.shields, s.x + C.SHOT_W / 2, s.y)) {
          s.active = false
          changed = true
          continue
        }
        if (w.ufo.active && overlaps(s.x, s.y, C.SHOT_W, C.SHOT_H, w.ufo.x, C.UFO_Y, C.UFO_W, C.UFO_H)) {
          s.active = false
          w.ufo.active = false
          w.ufoTimer = 15 + Math.random() * 12
          sfx.ufoHit()
          commitHud({ score: w.hud.score + w.ufo.points })
          continue
        }
        const c = Math.floor((s.x + C.SHOT_W / 2 - w.fx) / C.CELL_X)
        const r = Math.floor((s.y - w.fy) / C.ROW_H)
        if (c < 0 || c >= C.COLS || r < 0 || r >= C.ROWS || w.alive[r][c] !== 1) continue
        if (w.dying.some((d) => d.r === r && d.c === c)) continue
        if (!overlaps(s.x, s.y, C.SHOT_W, C.SHOT_H, w.fx + c * C.CELL_X, w.fy + r * C.ROW_H, C.INV_W, C.INV_H)) continue
        s.active = false
        w.killed++
        w.dying.push({ r, c, until: now + 140 })
        w.pops[r] = POP // SPATIAL: the hit row flinches toward you before the invader vanishes
        changed = true
        sfx.hit()
        commitHud({ score: w.hud.score + C.ROW_POINTS[r] })
        if (w.killed === C.ROWS * C.COLS) {
          sfx.wave()
          world.current = newWorld(w.hud.wave + 1, w.hud.score, w.hud.lives, 'playing', w.shields)
          setHud(world.current.hud)
          redraw((n) => n + 1)
          return
        }
      }

      // bombs: dropped by the bottom invader of a random column
      w.bombTimer -= dt
      if (w.bombTimer <= 0) {
        w.bombTimer = Math.max(0.3, 1.2 - w.hud.wave * 0.1) * (0.5 + Math.random())
        const b = w.bombs.find((x) => !x.active)
        const cols = [...Array(C.COLS).keys()].filter((c) => w.alive.some((row) => row[c]))
        if (b && cols.length) {
          const c = cols[Math.floor(Math.random() * cols.length)]
          let r = C.ROWS - 1
          while (!w.alive[r][c]) r--
          b.active = true
          b.x = w.fx + c * C.CELL_X + C.INV_W / 2 - C.BOMB_W / 2
          b.y = w.fy + r * C.ROW_H + C.INV_H
          b.z0 = rowWorldZ(w.fy, r) // SPATIAL
        }
      }
      for (const b of w.bombs) {
        if (!b.active) continue
        b.y += C.BOMB_SPEED * dt
        if (b.y > C.H) b.active = false
        else if (hitShield(w.shields, b.x + C.BOMB_W / 2, b.y + C.BOMB_H)) {
          b.active = false
          changed = true
        } else if (
          !w.invulnerable &&
          overlaps(b.x, b.y, C.BOMB_W, C.BOMB_H, w.shipX - C.SHIP_W / 2, C.SHIP_Y, C.SHIP_W, C.SHIP_H)
        ) {
          w.bombs.forEach((x) => (x.active = false))
          w.invulnerable = C.INVULNERABLE
          sfx.playerHit()
          const lives = w.hud.lives - 1
          commitHud({ lives })
          if (lives <= 0) return gameOver()
        }
      }

      if (changed) redraw((n) => n + 1)
    }

    const draw = (now: number) => {
      const w = world.current

      // The formation is five rows moving together.
      for (let r = 0; r < C.ROWS; r++) {
        place(rowRefs.current[r], w.fx, w.fy + r * C.ROW_H)
        // SPATIAL: each row's absolute depth = the formation's (which grows as it descends)
        // SPATIAL: + one step per row + its flinch. Rows are NOT nested in a spatial parent.
        writeBack(rowRefs.current[r], formationZ(w.fy) + rowZ(r, w.pops[r])) // SPATIAL
      }

      place(shipRef.current, w.shipX - C.SHIP_W / 2, C.SHIP_Y)
      show(shipRef.current, !w.invulnerable || Math.floor(now / 100) % 2 === 0)
      place(ufoRef.current, w.ufo.x, C.UFO_Y)
      show(ufoRef.current, w.ufo.active)

      const target = frontRow(w.alive) // SPATIAL
      w.shots.forEach((s, i) => {
        const el = shotRefs.current[i]
        show(el, s.active)
        if (!s.active) return
        place(el, s.x, s.y)
        // SPATIAL: a player shot recedes from the ship's plane to the row it is flying at.
        writeBack(el, lerp(SHIP_Z, rowWorldZ(w.fy, target, w.pops[target]), (C.SHIP_Y - s.y) / (C.SHIP_Y - (w.fy + target * C.ROW_H)))) // SPATIAL
      })
      w.bombs.forEach((b, i) => {
        const el = bombRefs.current[i]
        show(el, b.active)
        if (!b.active) return
        place(el, b.x, b.y)
        // SPATIAL: an enemy shot comes at you, from its row's depth to the ship's.
        writeBack(el, lerp(b.z0, SHIP_Z, (b.y - (w.fy + C.ROWS * C.ROW_H)) / (C.SHIP_Y - (w.fy + C.ROWS * C.ROW_H)))) // SPATIAL
      })
    }

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (world.current.hud.status === 'playing') update(dt, now)
      draw(now)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [commitHud, fire, gameOver])

  // On-screen controls: mouse / touch hold for the arrows, and a tap (click) for single steps.
  // SPATIAL: the buttons stay flat on the window so they are always in view, and a pinch on
  // SPATIAL: them arrives as an ordinary click. Do NOT add onSpatialTap to a <button>: inside
  // SPATIAL: the PICO runtime React logs "Unknown event handler property onSpatialTap".
  const tap = (fn: () => void) => ({ onClick: fn })
  const hold = (key: 'left' | 'right') => ({
    onPointerDown: () => (keys.current[key] = true),
    onPointerUp: () => (keys.current[key] = false),
    onPointerLeave: () => (keys.current[key] = false),
  })

  const w = world.current
  return (
    <div className="game">
      <header className="topbar">
        <div>
          <p className="pico-eyebrow">Lab 4 · Depth as gameplay</p>
          <h1 className="pico-display title">Spatial Invaders</h1>
        </div>
        <dl className="stats">
          <div>
            <dt>Score</dt>
            <dd>{hud.score}</dd>
          </div>
          <div>
            <dt>Lives</dt>
            <dd>{hud.lives}</dd>
          </div>
          <div>
            <dt>Wave</dt>
            <dd>{hud.wave}</dd>
          </div>
        </dl>
      </header>

      {/* SPATIAL { */}
      {/* The playfield stays a plain div. Spatial elements are never nested inside another
          spatial element here: on PICO OS 6.0.0 (web-app runtime 0.4.0) a nested enable-xr
          got a 0 x 0 document and never rendered (measured 2026-09-24). */}
      {/* SPATIAL } */}
      <div className="playfield" style={{ width: C.W, height: C.H }}>
        <div ref={ufoRef} className="ufo" />

        {w.alive.map((row, r) => (
          <div
            enable-xr
            key={r}
            ref={(el) => {
              rowRefs.current[r] = el
            }}
            className="row"
            style={{ width: C.FORMATION_W }}
          >
            {row.map((alive, c) => (
              <div
                key={c}
                className={`invader kind-${r} ${alive ? '' : 'gone'} ${w.dying.some((d) => d.r === r && d.c === c) ? 'dying' : ''}`}
                style={{ left: c * C.CELL_X }}
              />
            ))}
          </div>
        ))}

        <div
          enable-xr
          ref={shieldsRef}
          className="shields"
          style={{ top: C.SHIELD_Y, height: C.SHIELD_H }}
        >
          {w.shields.map((shield, s) => (
            <div key={s} className="shield" style={{ left: C.SHIELD_X[s], width: C.SHIELD_W, height: C.SHIELD_H }}>
              {shield.map((row, r) =>
                row.map((on, c) =>
                  on ? <div key={`${r}-${c}`} className="block" style={{ left: c * C.BLOCK, top: r * C.BLOCK }} /> : null,
                ),
              )}
            </div>
          ))}
        </div>

        <div
          enable-xr
          ref={shipRef}
          className="ship"
        />

        {Array.from({ length: C.SHOT_POOL }, (_, i) => (
          <div
            enable-xr
            key={i}
            ref={(el) => {
              shotRefs.current[i] = el
            }}
            className="shot"
          />
        ))}
        {Array.from({ length: C.BOMB_POOL }, (_, i) => (
          <div
            enable-xr
            key={i}
            ref={(el) => {
              bombRefs.current[i] = el
            }}
            className="bomb"
          />
        ))}

        {hud.status !== 'playing' && (
          <div
            enable-xr
            ref={overlayRef} // SPATIAL
            className="overlay"
          >
            <p className="pico-display overlay-title">
              {hud.status === 'ready' ? 'Ready?' : hud.status === 'paused' ? 'Paused' : 'Game over'}
            </p>
            <button className="pico-btn" type="button" onClick={primary}>
              {hud.status === 'over' ? 'Play again' : hud.status === 'paused' ? 'Resume' : 'Start'}
            </button>
          </div>
        )}
      </div>

      <div className="controls">
        {(['left', 'fire', 'right'] as const).map((b) => (
          <button
            key={b}
            type="button"
            className={b === 'fire' ? 'pico-btn pad fire' : 'pico-btn pico-btn--ghost pad'}
            aria-label={b === 'fire' ? 'Fire' : `Move ${b}`}
            {...(b === 'fire' ? tap(fire) : { ...hold(b), ...tap(() => nudge(b === 'left' ? -1 : 1)) })}
          >
            {b === 'left' ? '◀' : b === 'right' ? '▶' : 'Fire'}
          </button>
        ))}
        <span className="spacer" />
        <button className="pico-btn pico-btn--ghost" type="button" onClick={togglePause}>
          Pause
        </button>
        <button className="pico-btn pico-btn--ghost" type="button" onClick={() => setMuted(sfx.toggleMute())}>
          {muted ? 'Sound off' : 'Sound on'}
        </button>
        <button className="pico-btn pico-btn--ghost" type="button" onClick={() => openScene('hud')}> {/* SPATIAL */}
          HUD window {/* SPATIAL */}
        </button> {/* SPATIAL */}
      </div>
      <p className="keys">
        <kbd className="pico-kbd">←</kbd> <kbd className="pico-kbd">→</kbd> move · <kbd className="pico-kbd">Space</kbd> fire ·{' '}
        <kbd className="pico-kbd">Enter</kbd> start · <kbd className="pico-kbd">P</kbd> pause · <kbd className="pico-kbd">M</kbd>{' '}
        sound
      </p>
    </div>
  )
}
