export function App() {
  return (
    <main className="stage">
      <p className="pico-eyebrow">Lab 1 · Hello Spatial</p>
      <h1 className="pico-display title">Hello, spatial web.</h1>
      <p className="lede">
        This page is an ordinary React page. The card below is the only spatial thing in it.
      </p>

      {/* enable-xr turns this div into a spatialized element. --xr-back (in app.css)
          lifts it toward you, and --xr-background-material gives it a glass back. */}
      <div enable-xr className="lifted pico-panel">
        <span className="pico-chip pico-chip--accent">enable-xr · --xr-back: 80</span>
        <p className="lifted-copy">I float 80px in front of the page on PICO OS 6.</p>
        <p className="lifted-hint">In a desktop browser I am just a card.</p>
      </div>
    </main>
  )
}
