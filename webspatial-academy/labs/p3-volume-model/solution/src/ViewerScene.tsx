import { useRef, useState } from 'react'
import {
  Model,
  WebSpatialRuntime,
  useSpatialReady,
  type ModelSpatialDragEvent,
  type ModelSpatialMagnifyEvent,
} from '@webspatial/react-sdk'
import { MODEL } from './model'

const DEG_PER_PX = 0.4 // how far a pinch-drag turns the model
const MIN_SCALE = 0.5
const MAX_SCALE = 3

type View = { yaw: number; scale: number }
const HOME: View = { yaw: 0, scale: 1 }

export function ViewerScene() {
  // STEP 3: decide between real 3D and a flat fallback.
  // useSpatialReady() is true once the spatial runtime has booted (PICO OS 6, visionOS).
  // supports('Model') asks that runtime whether it can render <Model>.
  const ready = useSpatialReady()
  const has3D = ready && WebSpatialRuntime.supports('Model')

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [orbit, setOrbit] = useState(false)
  const [view, setView] = useState<View>(HOME)

  // The view at the moment a gesture started. Drag and magnify report totals since the
  // gesture began, so we add them to this, never to the live value.
  const base = useRef<View>(HOME)
  const magnifying = useRef(false)

  // STEP 4: gestures.
  const onDragStart = () => {
    base.current = view
  }
  const onDrag = (e: ModelSpatialDragEvent) => {
    setView((v) => ({ ...v, yaw: base.current.yaw + e.translationX * DEG_PER_PX }))
  }
  const onMagnify = (e: ModelSpatialMagnifyEvent) => {
    if (!magnifying.current) {
      magnifying.current = true
      base.current = view
    }
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, base.current.scale * e.magnification))
    setView((v) => ({ ...v, scale }))
  }
  const onMagnifyEnd = () => {
    magnifying.current = false
  }
  const reset = () => setView(HOME)

  const readout = `yaw ${Math.round(view.yaw)}° · scale ${view.scale.toFixed(2)}×`

  return (
    <main className="viewer">
      {has3D ? (
        // STEP 2: the model. enable-xr upgrades <Model> from a flat <model> element into a
        // real 3D container. In orbit mode the runtime turns it for you, so our own drag
        // handlers step aside.
        <Model
          enable-xr
          className="viewer-model"
          src={MODEL.src}
          poster={MODEL.poster}
          stagemode={orbit ? 'orbit' : 'none'}
          style={{ transform: `rotateY(${view.yaw}deg) scale3d(${view.scale}, ${view.scale}, ${view.scale})` }}
          onLoad={() => setStatus('ready')}
          onError={() => setStatus('error')}
          onSpatialTap={reset}
          onSpatialDragStart={orbit ? undefined : onDragStart}
          onSpatialDrag={orbit ? undefined : onDrag}
          onSpatialMagnify={onMagnify}
          onSpatialMagnifyEnd={onMagnifyEnd}
        />
      ) : (
        <div className="viewer-fallback pico-panel">
          <img src={MODEL.poster} alt={`${MODEL.name}, flat preview`} width={240} height={240} />
          <p>
            The 3D model renders in a volume on PICO OS 6. This browser has no WebSpatial
            runtime, so you get the poster instead.
          </p>
        </div>
      )}

      {/* A plain panel, not enable-xr: a 2D spatial panel inside this volume failed to
          create in the PICO OS 6.0.0 emulator (2026-09-24), so the controls stay flat. */}
      <div className="viewer-bar pico-panel">
        <span className={`pico-chip ${statusChip(has3D, status)}`}>
          {!has3D ? 'flat fallback' : status === 'loading' ? 'loading model…' : status}
        </span>
        <span className="readout">{readout}</span>
        <button className="pico-btn pico-btn--ghost" type="button" onClick={() => setOrbit((o) => !o)}>
          Orbit: {orbit ? 'on' : 'off'}
        </button>
        <button className="pico-btn" type="button" onClick={reset}>
          Reset
        </button>
      </div>
    </main>
  )
}

function statusChip(has3D: boolean, status: 'loading' | 'ready' | 'error') {
  if (!has3D) return 'pico-chip--warn'
  if (status === 'ready') return 'pico-chip--ok'
  if (status === 'error') return 'pico-chip--danger'
  return ''
}
