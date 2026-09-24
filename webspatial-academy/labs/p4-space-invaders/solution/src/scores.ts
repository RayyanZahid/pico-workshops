// Hall-of-fame persistence. localStorage is shared by every same-origin scene.

const KEY = 'spatial-invaders:scores'
const MAX = 8

export type ScoreRow = { score: number; wave: number; at: number }

export function loadScores(): ScoreRow[] {
  try {
    const rows: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    if (!Array.isArray(rows)) return []
    return rows
      .filter((r): r is ScoreRow => typeof r?.score === 'number' && typeof r?.at === 'number')
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX)
  } catch {
    return []
  }
}

export function saveScore(score: number, wave: number): ScoreRow[] {
  const rows = [...loadScores(), { score, wave, at: Date.now() }].sort((a, b) => b.score - a.score).slice(0, MAX)
  try {
    localStorage.setItem(KEY, JSON.stringify(rows))
  } catch {
    // private mode or quota: the round still counted, it just isn't remembered
  }
  return rows
}
