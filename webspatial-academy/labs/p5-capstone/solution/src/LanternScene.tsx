import { useMemo } from 'react'
import {
  CylinderEntity,
  Entity,
  Material,
  Reality,
  SphereEntity,
  World,
  WebSpatialRuntime,
  useSpatialReady,
} from '@webspatial/react-sdk'

// A string of five lanterns over the market, built from primitives (metres; origin at
// the centre of the volume). No asset to download.
const LANTERNS = [-0.22, -0.11, 0, 0.11, 0.22].map((x, i) => ({ x, y: 0.08 - Math.abs(x) * 0.35, i }))

function token(name: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

export function LanternScene() {
  const ready = useSpatialReady()
  const spatial = ready && WebSpatialRuntime.supports('Reality')
  const colors = useMemo(
    () => ({ glow: token('--pico-warn', '#ffb020'), cap: token('--pico-surface-2', '#232526') }),
    [],
  )

  if (!spatial) {
    return (
      <main className="scene-stall">
        <p className="pico-eyebrow">Lanterns</p>
        <p className="lantern-fallback" aria-hidden="true">
          {LANTERNS.map((l) => (
            <span key={l.i} />
          ))}
        </p>
        <p>The lanterns hang in a 3D volume on PICO OS 6. This browser gets the flat version.</p>
      </main>
    )
  }

  return (
    // Size the 3D container in viewport units. This page's #root has no height, so a
    // height of 100% resolves to 0 and the volume shows empty glass (PICO OS 6.0.0 emulator,
    // 2026-09-24): the entities are created, but inside a zero-height container.
    <Reality style={{ width: '100vw', height: '100vh' }}>
      <Material type="unlit" id="glow" color={colors.glow} />
      <Material type="unlit" id="cap" color={colors.cap} />
      <World>
        {LANTERNS.map((l) => (
          <Entity key={l.i} position={{ x: l.x, y: l.y, z: 0 }}>
            <SphereEntity radius={0.04} materials={['glow']} />
            <CylinderEntity radius={0.018} height={0.012} position={{ x: 0, y: 0.045, z: 0 }} materials={['cap']} />
          </Entity>
        ))}
      </World>
    </Reality>
  )
}
