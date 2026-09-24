// Examples reuse the kit's one npm install (labs/node_modules) instead of a second one.
// Node resolves packages by walking up from the importing file, so a junction at
// examples/node_modules -> labs/node_modules makes every example resolve the pinned SDK 2.0.0.
// Runs automatically before `npm run dev` / `dev:xr` / `build` in each example. Idempotent.
import { existsSync, symlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const target = fileURLToPath(new URL('../labs/node_modules', import.meta.url))
const link = fileURLToPath(new URL('./node_modules', import.meta.url))

if (!existsSync(target)) {
  console.error('labs/node_modules is missing. From the kit root run: npm run labs:install')
  process.exit(1)
}
if (!existsSync(link)) {
  symlinkSync(target, link, 'junction')
  console.log('linked examples/node_modules -> labs/node_modules')
}
