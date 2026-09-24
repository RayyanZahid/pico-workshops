import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig, searchForWorkspaceRoot } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// The academy's shared PICO theme: pico-webspatial-academy/theme/pico.css
const theme = fileURLToPath(new URL('../../theme/', import.meta.url))

// Upstream (webspatial-sdk apps/spatial-vite-min) relies on plugin-react reading
// jsxImportSource from tsconfig. Vite 8 transforms with oxc and does not, so the kit
// passes it explicitly; without this line every enable-xr goes inert with no error.
export default defineConfig({
  plugins: [react({ jsxImportSource: '@webspatial/react-sdk' })],
  resolve: {
    alias: { '@pico/theme': theme },
  },
  server: {
    port: 5501,
    strictPort: true,
    fs: { allow: [searchForWorkspaceRoot(process.cwd()), theme] },
  },
  build: {
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html'),
        eagerLean: path.resolve(__dirname, 'eager-lean.html'),
        xrMonitor: path.resolve(__dirname, 'xr-monitor.html'),
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
})
