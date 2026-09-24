import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SpatialBoot } from '@webspatial/react-sdk'
import '@pico/theme/pico.css'
import './app.css'
import { App } from './App'
import { RuntimeBadge } from './RuntimeBadge'
import { installSpatialRetry } from './spatialRetry'

// PICO OS 6 and visionOS put "WebSpatial/<version>" in the user agent. We tag <html>
// so app.css can drop the page background and let the glass material show through.
if (/WebSpatial\//.test(navigator.userAgent)) {
  document.documentElement.classList.add('is-spatial')
}

// A slow cold start can time out spatial element creation; reload once if it does.
installSpatialRetry()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* SpatialBoot loads the spatial runtime on PICO / visionOS and does nothing in a
        desktop browser. Without it, enable-xr is ignored even inside the headset. */}
    <SpatialBoot onError={(err) => console.error('WebSpatial boot failed', err)}>
      <App />
    </SpatialBoot>
    <RuntimeBadge />
  </StrictMode>,
)
