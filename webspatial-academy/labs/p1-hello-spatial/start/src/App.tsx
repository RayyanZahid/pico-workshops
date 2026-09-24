export function App() {
  return (
    <main className="stage">
      <p className="pico-eyebrow">Lab 1 · Hello Spatial</p>
      <h1 className="pico-display title">Hello, spatial web.</h1>
      <p className="lede">
        This page is an ordinary React page. The card below is the only spatial thing in it.
      </p>

      {/* TODO (step 4): make this card spatial. */}
      <div className="lifted pico-panel">
        <span className="pico-chip pico-chip--accent">just a div, for now</span>
        <p className="lifted-copy">I float 80px in front of the page on PICO OS 6.</p>
        <p className="lifted-hint">In a desktop browser I am just a card.</p>
      </div>
    </main>
  )
}
