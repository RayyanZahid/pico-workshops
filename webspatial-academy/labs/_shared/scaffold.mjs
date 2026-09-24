// Writes the boilerplate every lab project shares (package.json, tsconfig, vite config,
// index.html, icons). App code (src/App.tsx etc.) is hand-written per lab and never touched.
// Usage: node _shared/scaffold.mjs            (from labs/, idempotent, skips existing files
//        node _shared/scaffold.mjs --force    unless --force)
import { mkdirSync, writeFileSync, existsSync, copyFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const labs = join(dirname(fileURLToPath(import.meta.url)), '..')
const force = process.argv.includes('--force')

const SDK = '2.0.0'
const V = {
  react: '^19.2.8', reactDom: '^19.2.8', typesReact: '^19.2.17', typesReactDom: '^19.2.3',
  typesNode: '^24.13.3', pluginReact: '^6.0.4', vite: '^8.2.0', typescript: '~6.0.2',
}

// spatial: true -> WebSpatial wired (deps, jsxImportSource, manifest link)
const projects = [
  { dir: 'p1-hello-spatial/start', name: 'p1-hello-spatial-start', title: 'Hello Spatial (start)', port: 5301, spatial: false },
  { dir: 'p1-hello-spatial/solution', name: 'p1-hello-spatial-solution', title: 'Hello Spatial', port: 5311, spatial: true },
  { dir: 'p2-spatialize-site/start', name: 'p2-spatialize-site-start', title: 'Swanfest 2026', port: 5302, spatial: false },
  { dir: 'p2-spatialize-site/solution', name: 'p2-spatialize-site-solution', title: 'Swanfest 2026', port: 5312, spatial: true },
  { dir: 'p3-volume-model/start', name: 'p3-volume-model-start', title: 'Model Viewer (start)', port: 5303, spatial: true },
  { dir: 'p3-volume-model/solution', name: 'p3-volume-model-solution', title: 'Model Viewer', port: 5313, spatial: true },
  { dir: 'p4-space-invaders/start', name: 'p4-space-invaders-start', title: 'Spatial Invaders (start)', port: 5304, spatial: false },
  { dir: 'p4-space-invaders/solution', name: 'p4-space-invaders-solution', title: 'Spatial Invaders', port: 5314, spatial: true },
  { dir: 'p5-capstone/template', name: 'p5-capstone-template', title: 'Night Market', port: 5305, spatial: false },
  { dir: 'p5-capstone/solution', name: 'p5-capstone-solution', title: 'Night Market', port: 5315, spatial: true },
]

function write(path, body) {
  if (existsSync(path) && !force) return
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, body.replace(/\r\n/g, '\n'))
  console.log('wrote', path.slice(labs.length + 1))
}

for (const p of projects) {
  const root = join(labs, p.dir)
  // labs/<lab>/<variant>/ -> academy root is three levels up
  const deps = { react: V.react, 'react-dom': V.reactDom }
  if (p.spatial) Object.assign(deps, { '@webspatial/core-sdk': SDK, '@webspatial/react-sdk': SDK })
  write(join(root, 'package.json'), JSON.stringify({
    name: p.name,
    private: true,
    version: '0.0.0',
    type: 'module',
    scripts: {
      dev: `vite --port ${p.port}`,
      'dev:xr': `vite --host 0.0.0.0 --port ${p.port}`,
      build: 'tsc --noEmit && vite build',
      'build:xr': 'tsc --noEmit && vite build',
      preview: `vite preview --port ${p.port}`,
      'preview:xr': `vite preview --host 0.0.0.0 --port ${p.port}`,
    },
    dependencies: Object.fromEntries(Object.entries(deps).sort()),
    devDependencies: {
      '@types/node': V.typesNode,
      '@types/react': V.typesReact,
      '@types/react-dom': V.typesReactDom,
      '@vitejs/plugin-react': V.pluginReact,
      typescript: V.typescript,
      vite: V.vite,
    },
  }, null, 2) + '\n')

  write(join(root, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'es2023',
      lib: ['ES2023', 'DOM', 'DOM.Iterable'],
      module: 'esnext',
      moduleResolution: 'bundler',
      types: ['vite/client', 'node'],
      skipLibCheck: true,
      allowImportingTsExtensions: true,
      verbatimModuleSyntax: true,
      moduleDetection: 'force',
      noEmit: true,
      jsx: 'react-jsx',
      ...(p.spatial ? { jsxImportSource: '@webspatial/react-sdk' } : {}),
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
    },
    include: ['src', 'vite.config.ts'],
  }, null, 2) + '\n')

  const reactCall = p.spatial
    ? `react({ jsxImportSource: '@webspatial/react-sdk' })`
    : 'react()'
  const jsxNote = p.spatial
    ? `    // WebSpatial: route JSX through the SDK so plain tags accept enable-xr and
    // the --xr-* styles. tsconfig.json says the same thing for the type checker.
`
    : ''
  write(join(root, 'vite.config.ts'), `import { defineConfig, searchForWorkspaceRoot } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// The academy's shared PICO theme: pico-webspatial-academy/theme/pico.css
const theme = fileURLToPath(new URL('../../../theme/', import.meta.url))

export default defineConfig({
  plugins: [
${jsxNote}    ${reactCall},
  ],
  resolve: {
    alias: { '@pico/theme': theme },
  },
  server: {
    port: ${p.port},
    strictPort: true,
    // The theme sits outside this project, so let the dev server read it.
    fs: { allow: [searchForWorkspaceRoot(process.cwd()), theme] },
  },
})
`)

  write(join(root, 'src/vite-env.d.ts'), '/// <reference types="vite/client" />\n')

  // Every lab, flat or spatial, ships a manifest: PICO OS 6 only offers "Open as standalone
  // app" (and only spatializes) for a page whose URL belongs to a Web App's scope.
  const manifestLink = `    <!-- Web app manifest: names the app, sizes the first window, and is what makes
         "Open as standalone app" appear in the PICO OS 6 browser. -->
    <link rel="manifest" href="/app.webmanifest" />
`
  write(join(root, 'index.html'), `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/icons/icon-192.png" />
${manifestLink}    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${p.title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`)

  // Shared source files (RuntimeBadge): always overwritten, _shared/src is the one copy to edit.
  for (const f of readdirSync(join(labs, '_shared/src'))) {
    copyFileSync(join(labs, '_shared/src', f), join(root, 'src', f))
  }

  // Spatial child documents request /favicon.ico themselves (they don't see the <link> icon),
  // so every lab ships one; without it the headset console shows a 404.
  mkdirSync(join(root, 'public'), { recursive: true })
  copyFileSync(join(labs, '_shared/favicon.ico'), join(root, 'public/favicon.ico'))

  mkdirSync(join(root, 'public/icons'), { recursive: true })
  for (const f of readdirSync(join(labs, '_shared/icons'))) {
    const dst = join(root, 'public/icons', f)
    if (!existsSync(dst) || force) copyFileSync(join(labs, '_shared/icons', f), dst)
  }
}
