import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SpatialBoot } from '@webspatial/react-sdk'
import '@pico/theme/pico.css'
import './app.css'
import { App } from './App'
import { ViewerScene } from './ViewerScene'
import { currentScene, registerScenes } from './scenes'
import { RuntimeBadge } from './RuntimeBadge'
import { installSpatialRetry } from './spatialRetry'

if (/WebSpatial\//.test(navigator.userAgent)) {
  document.documentElement.classList.add('is-spatial')
}

// A slow cold start can time out spatial element creation; reload once if it does.
installSpatialRetry()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* registerScenes runs in onReady, NOT at module load: in SDK 2.0's lazy entry initScene is a
        silent no-op until the spatial runtime has booted, and the scene would open as a default
        flat window (measured in the PICO OS 6 emulator, 2026-09-24). */}
    <SpatialBoot onReady={registerScenes} onError={(err) => console.error('WebSpatial boot failed', err)}>
      {currentScene() === 'viewer' ? <ViewerScene /> : <App />}
    </SpatialBoot>
    <RuntimeBadge />
  </StrictMode>,
)
