// depth.ts: every Z decision in the game lives here. Z is presentation only; collisions
// stay 2D, so the game plays identically in a desktop browser, which ignores --xr-back.
//
// Depths are --xr-back values in px (the only unit it takes, one decimal, never negative),
// measured from the WINDOW's plane. No spatial element is nested inside another one: on
// PICO OS 6.0.0 a nested enable-xr got a 0 x 0 document and never rendered (emulator,
// 2026-09-24), so every layer's depth here is absolute. Bigger = closer to you.

// Kept small on purpose. In the emulator's default view a plane lifted far toward you, low
// in the window, projects below the window's bottom edge: at SHIP_Z 260 the ship vanished
// (PICO OS 6.0.0, 2026-09-24). Everything here stays inside the window's footprint, and the
// ship stays closest: the deepest possible front row is 5 + 412 * 0.08 + 80 = 118 < 120.
export const BASE = 5 // formation depth at the top of the playfield
export const APPROACH = 0.08 // px of depth gained per px of descent: z is tied to y
export const ROW_STEP = 20 // row 0 (top, back) at 0, then 20, 40, 60, 80 in front of the formation
export const SHIELD_Z = 100 // shields float between the formation and you
export const SHIP_Z = 120 // the ship is always the closest thing
export const OVERLAY_Z = 150 // ready / paused / game over card, in front of everything
export const POP = 24 // how far a hit row flinches toward you
export const POP_DECAY = 0.85 // per frame at 60 fps: back to rest in about 200 ms

/** Formation depth. */
export const formationZ = (y: number) => BASE + y * APPROACH

/** A row's offset in front of the formation's depth: back row 0, front row 120. */
export const rowZ = (row: number, pop = 0) => row * ROW_STEP + pop

/** A row's absolute depth: what its --xr-back is set to, and where a shot aimed at it arrives. */
export const rowWorldZ = (formationY: number, row: number, pop = 0) => formationZ(formationY) + rowZ(row, pop)

export const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t))

// Write --xr-back through a ref, only when the rounded value changed. Unchanged writes still
// cost a bridge update in the headset. `el.style['--xr-back'] = value` is the documented
// imperative form (webspatial.dev, CSS API "back", Animatable), and the SDK types it.
const last = new WeakMap<HTMLElement, number>()
export function writeBack(el: HTMLElement | null, z: number) {
  if (!el) return
  const v = Math.round(Math.max(0, z) * 10) / 10
  if (last.get(el) === v) return
  last.set(el, v)
  el.style['--xr-back'] = String(v)
}
