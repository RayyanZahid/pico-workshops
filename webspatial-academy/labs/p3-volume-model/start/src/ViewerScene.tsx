import { MODEL } from './model'

// The 3D window. Right now it only shows the flat poster.
//
// TODO (step 2): render the GLB with the SDK's <Model> component (enable-xr, src, poster,
//                onLoad / onError).
// TODO (step 3): show <Model> only when useSpatialReady() is true and
//                WebSpatialRuntime.supports('Model') says yes; keep the poster as the fallback.
// TODO (step 4): pinch-drag turns the model, two-hand magnify scales it, tap resets it.

export function ViewerScene() {
  return (
    <main className="viewer">
      <div className="viewer-fallback pico-panel">
        <img src={MODEL.poster} alt={`${MODEL.name}, flat preview`} width={240} height={240} />
        <p>The 3D model goes here.</p>
      </div>

      {/* A plain panel, not enable-xr: a 2D spatial panel inside this volume failed to
          create in the PICO OS 6.0.0 emulator (2026-09-24), so the controls stay flat. */}
      <div className="viewer-bar pico-panel">
        <span className="pico-chip pico-chip--warn">no model yet</span>
        <span className="readout">yaw 0° · scale 1.00×</span>
      </div>
    </main>
  )
}
