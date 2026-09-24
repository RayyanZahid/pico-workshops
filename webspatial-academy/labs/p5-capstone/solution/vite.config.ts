import { defineConfig, searchForWorkspaceRoot } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// The academy's shared PICO theme: pico-webspatial-academy/theme/pico.css
const theme = fileURLToPath(new URL('../../../theme/', import.meta.url))

export default defineConfig({
  plugins: [
    // WebSpatial: route JSX through the SDK so plain tags accept enable-xr and
    // the --xr-* styles. tsconfig.json says the same thing for the type checker.
    react({ jsxImportSource: '@webspatial/react-sdk' }),
  ],
  resolve: {
    alias: { '@pico/theme': theme },
  },
  server: {
    port: 5315,
    strictPort: true,
    // The theme sits outside this project, so let the dev server read it.
    fs: { allow: [searchForWorkspaceRoot(process.cwd()), theme] },
  },
})
