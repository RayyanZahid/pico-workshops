import { useEffect, useState } from 'react'
import './runtime-badge.css'

// Shows, at a glance, why nothing pops out. PICO OS 6 only spatializes a page running as a
// standalone Web App (display-mode standalone / minimal-ui), never in a browser tab.
// Detection follows PICO's docs (developer.picoxr.com/document/web/install-free/).
// This file is copied into every lab by labs/_shared/scaffold.mjs; edit it there.

type Runtime = 'browser' | 'webapp'

const QUERIES = ['(display-mode: standalone)', '(display-mode: minimal-ui)']

function detect(): Runtime {
  return QUERIES.some((q) => window.matchMedia(q).matches) ? 'webapp' : 'browser'
}

export function RuntimeBadge() {
  const [runtime, setRuntime] = useState<Runtime>(detect)
  const spatial = /WebSpatial\//.test(navigator.userAgent)

  useEffect(() => {
    const lists = QUERIES.map((q) => window.matchMedia(q))
    const update = () => setRuntime(detect())
    lists.forEach((l) => l.addEventListener('change', update))
    return () => lists.forEach((l) => l.removeEventListener('change', update))
  }, [])

  const [tone, label] =
    runtime === 'webapp'
      ? spatial
        ? ['ok', 'Web app · WebSpatial on']
        : ['warn', 'Web app · no WebSpatial runtime']
      : ['warn', 'Browser tab · flat. Install app (monitor icon) for depth']

  return (
    <div className={`runtime-badge pico-chip pico-chip--${tone}`} role="status" data-runtime={runtime}>
      {label}
    </div>
  )
}
