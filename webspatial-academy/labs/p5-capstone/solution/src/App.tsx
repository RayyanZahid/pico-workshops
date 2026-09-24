import { useState } from 'react'
import { useSpatialReady } from '@webspatial/react-sdk'
import { hours, vendors, type Vendor } from './data'
import { openScene } from './scenes'

export function App() {
  const [selected, setSelected] = useState<Vendor | null>(null)
  const spatial = useSpatialReady()

  // A fixed full-screen overlay is a desktop idiom. In the headset, a stall opens as its
  // own small window instead; in a browser the modal stays.
  const showStall = (v: Vendor) => (spatial ? openScene('stall', { id: v.id }) : setSelected(v))

  return (
    <div className="page">
      <nav enable-xr className="nav">
        <span className="brand">NIGHT MARKET</span>
        <div className="nav-links">
          <a href="#vendors">Vendors</a>
          <a href="#visit">Visit</a>
        </div>
      </nav>

      <header enable-xr className="hero">
        <p className="pico-eyebrow">Pier 9 · every weekend</p>
        <h1 className="pico-display hero-title">Thirty stalls, one long table, lanterns overhead.</h1>
        <p className="hero-lede">A fictional street-food market, and your capstone canvas.</p>
        <div className="hero-actions">
          <a className="pico-btn" href="#vendors">Find your dinner</a>
          <button className="pico-btn pico-btn--ghost" type="button" onClick={() => openScene('lanterns')}>
            Lanterns in 3D
          </button>
        </div>
      </header>

      <section id="vendors" className="vendors" enable-xr-monitor>
        {vendors.map((v) => (
          <article key={v.id} enable-xr className="vendor pico-panel">
            <div className="vendor-head">
              <span className="pico-chip">{v.cuisine}</span>
              <span className="vendor-price">{v.price}</span>
            </div>
            <h2 className="vendor-name">{v.name}</h2>
            <p className="vendor-blurb">{v.blurb}</p>
            <button className="pico-btn pico-btn--ghost" type="button" onClick={() => showStall(v)}>
              Stall {v.stall}
            </button>
          </article>
        ))}
      </section>

      <section id="visit" enable-xr className="visit pico-panel">
        <h2 className="pico-display visit-title">Visit</h2>
        <ul className="hours">
          {hours.map((h) => (
            <li key={h.day}>
              <span>{h.day}</span>
              <span className="hours-time">{h.time}</span>
            </li>
          ))}
        </ul>
        <p className="visit-note">Cash and cards. Dogs on leads welcome. Bring a jacket.</p>
      </section>

      {selected && (
        <div className="sheet" role="dialog" aria-label={selected.name}>
          <div className="sheet-card pico-panel">
            <p className="pico-eyebrow">Stall {selected.stall}</p>
            <h2 className="pico-display">{selected.name}</h2>
            <p>{selected.blurb}</p>
            <button className="pico-btn" type="button" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
