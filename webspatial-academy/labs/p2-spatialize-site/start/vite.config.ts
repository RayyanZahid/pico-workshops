import { defineConfig, searchForWorkspaceRoot } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// The academy's shared PICO theme: pico-webspatial-academy/theme/pico.css
const theme = fileURLToPath(new URL('../../../theme/', import.meta.url))

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: { '@pico/theme': theme },
  },
  server: {
    port: 5302,
    strictPort: true,
    // The theme sits outside this project, so let the dev server read it.
    fs: { allow: [searchForWorkspaceRoot(process.cwd()), theme] },
  },
})
