import { openViewer } from './scenes'
import { MODEL } from './model'

// The launcher window: a flat panel that opens the 3D volume.
export function App() {
  return (
    <main className="launcher">
      <div enable-xr className="launcher-card pico-panel">
        <p className="pico-eyebrow">Lab 3 · Volumes and models</p>
        <h1 className="pico-display launcher-title">{MODEL.name}</h1>
        <img className="launcher-poster" src={MODEL.poster} alt="" width={160} height={160} />
        <dl className="facts">
          <div>
            <dt>File</dt>
            <dd>{MODEL.file}</dd>
          </div>
          <div>
            <dt>Size</dt>
            <dd>{MODEL.sizeLabel}</dd>
          </div>
          <div>
            <dt>Triangles</dt>
            <dd>{MODEL.triangles}</dd>
          </div>
          <div>
            <dt>License</dt>
            <dd>{MODEL.license}</dd>
          </div>
        </dl>
        <button className="pico-btn" type="button" onClick={openViewer}>
          Open in 3D
        </button>
        <p className="hint">
          Opens a 0.6 m volume on PICO OS 6. In a desktop browser it opens a tab with a flat
          preview.
        </p>
      </div>
    </main>
  )
}
