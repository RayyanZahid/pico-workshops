import { vendors } from './data'

/** One stall, as its own window. The id arrives in the URL (?scene=stall&id=taco). */
export function StallScene() {
  const id = new URLSearchParams(window.location.search).get('id')
  const v = vendors.find((x) => x.id === id)

  if (!v) {
    return (
      <main className="scene-stall">
        <p className="pico-eyebrow">Night Market</p>
        <p>That stall has packed up for the night.</p>
      </main>
    )
  }

  return (
    <main className="scene-stall">
      <p className="pico-eyebrow">Stall {v.stall}</p>
      <h1 className="pico-display scene-stall-title">{v.name}</h1>
      <div enable-xr className="scene-stall-card pico-panel">
        <span className="pico-chip">{v.cuisine}</span>
        <p>{v.blurb}</p>
        <span className="vendor-price">{v.price}</span>
      </div>
    </main>
  )
}
