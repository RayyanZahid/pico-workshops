// Playfield geometry, in CSS px. Game logic and collisions are pure 2D.
export const W = 720
export const H = 640

// Formation: the classic 5 x 11.
export const COLS = 11
export const ROWS = 5
export const INV_W = 34
export const INV_H = 24
export const CELL_X = 50 // invader width + gap
export const ROW_H = 40 // invader height + gap
export const FORMATION_W = (COLS - 1) * CELL_X + INV_W
export const START_Y = 80
export const DROP = 18 // px the formation drops at each edge
export const ROW_POINTS = [30, 20, 20, 10, 10] // top row is worth most

// Player.
export const SHIP_W = 44
export const SHIP_H = 20
export const SHIP_Y = H - 44
export const SHIP_SPEED = 300 // px/s
export const NUDGE = 48 // px per tap on the on-screen arrows
export const LIVES = 3
export const INVULNERABLE = 1.5 // s after being hit

// Shots and bombs come from small pools, reused forever.
export const SHOT_W = 4
export const SHOT_H = 14
export const SHOT_SPEED = 560
export const SHOT_POOL = 2
export const FIRE_COOLDOWN = 0.28 // s
export const BOMB_W = 6
export const BOMB_H = 14
export const BOMB_SPEED = 220
export const BOMB_POOL = 2

// Shields: four bunkers of 8 x 5 blocks that erode.
export const SHIELDS = 4
export const SH_COLS = 8
export const SH_ROWS = 5
export const BLOCK = 8
export const SHIELD_W = SH_COLS * BLOCK
export const SHIELD_H = SH_ROWS * BLOCK
export const SHIELD_Y = SHIP_Y - 96
export const SHIELD_X = Array.from(
  { length: SHIELDS },
  (_, i) => Math.round(((W - SHIELDS * SHIELD_W) / (SHIELDS + 1)) * (i + 1) + SHIELD_W * i),
)
/** Bunker shape: an arch, with the corners and a doorway cut out. */
export const shieldShape = (): boolean[][] =>
  Array.from({ length: SH_ROWS }, (_, r) =>
    Array.from({ length: SH_COLS }, (_, c) => {
      if (r === 0 && (c === 0 || c === SH_COLS - 1)) return false
      if (r >= SH_ROWS - 2 && c >= 2 && c <= SH_COLS - 3) return false
      return true
    }),
  )

// The UFO crosses the top now and then.
export const UFO_Y = 34
export const UFO_W = 48
export const UFO_H = 20
export const UFO_SPEED = 120
export const UFO_POINTS = [50, 100, 150, 300]
