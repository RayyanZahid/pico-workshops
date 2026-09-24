import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@pico/theme/pico.css'
import './app.css'
import { App } from './App'
import { RuntimeBadge } from './RuntimeBadge'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <RuntimeBadge />
  </StrictMode>,
)
