// On a cold launch of an installed PICO web app, the runtime can take longer to answer than
// the SDK's 30 s request timeout. The SDK then rejects with "createSpatialized2DElement
// failed", never retries, and the page shows an empty glass window. A reload of the warm
// app succeeds (PICO OS 6.0.0 emulator, 2026-09-24). This does that reload once for you.
// This file is copied into every lab by labs/_shared/scaffold.mjs; edit it there.

const KEY = 'webspatial-retry-reloaded'

export function installSpatialRetry() {
  window.addEventListener('unhandledrejection', (event) => {
    const message = String((event.reason as Error | undefined)?.message ?? event.reason)
    if (!message.includes('createSpatialized2DElement failed')) return
    try {
      if (sessionStorage.getItem(KEY)) return // already retried once this session
      sessionStorage.setItem(KEY, '1')
    } catch {
      return
    }
    console.warn('WebSpatial: a spatial element failed to create (slow cold start). Reloading once.')
    window.setTimeout(() => window.location.reload(), 500)
  })
}
