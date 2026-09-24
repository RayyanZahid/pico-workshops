// Derives a lab's flat start/ from its solution/ by deleting the spatial layer.
//   node _shared/strip-spatial.mjs p4-space-invaders            (run from labs/)
// Markers in solution/src:
//   // SPATIAL { ... // SPATIAL }            block (also /* SPATIAL { */ ... /* SPATIAL } */ in CSS)
//   any line containing "// SPATIAL" or "{/* SPATIAL */}"   removed
//   the enable-xr attribute                                  removed
// Files listed in spatial-only.txt (one per line) are not copied. main.tsx is never copied:
// start/ keeps its own.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const lab = process.argv[2]
if (!lab) throw new Error('usage: node _shared/strip-spatial.mjs <lab folder>')
const src = join(lab, 'solution/src')
const dst = join(lab, 'start/src')
const skipFile = join(lab, 'spatial-only.txt')
const skip = new Set(['main.tsx', 'RuntimeBadge.tsx', 'runtime-badge.css', 'vite-env.d.ts'])
if (existsSync(skipFile)) for (const l of readFileSync(skipFile, 'utf8').split(/\r?\n/)) if (l.trim()) skip.add(l.trim())

function strip(text) {
  const out = []
  let depth = 0
  for (const line of text.split('\n')) {
    if (/(\/\/|\/\*) SPATIAL \{/.test(line)) { depth++; continue }
    if (/(\/\/|\/\*) SPATIAL \}/.test(line)) { depth--; continue }
    if (depth > 0) continue
    if (line.includes('// SPATIAL') || line.includes('{/* SPATIAL */}')) continue
    if (line.trim() === 'enable-xr') continue
    out.push(line.replace(/ enable-xr(?=[\s>])/g, ''))
  }
  if (depth !== 0) throw new Error('unbalanced SPATIAL markers')
  return out
    .join('\n')
    .replace(/\n\s*ref=\{\(el\) => \{\n\s*\}\}/g, '') // a ref callback whose only line was spatial
    .replace(/\n{3,}/g, '\n\n')
}

for (const f of readdirSync(src)) {
  if (skip.has(f)) continue
  const text = strip(readFileSync(join(src, f), 'utf8'))
  if (/enable-xr|--xr-|SPATIAL/.test(text)) throw new Error(`${f}: spatial leftovers after strip`)
  writeFileSync(join(dst, f), text)
  console.log('wrote', join(dst, f))
}
