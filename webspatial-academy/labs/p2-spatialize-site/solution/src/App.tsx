import { features, schedule, stats } from './data'
import { openSchedule } from './scenes'

export function App() {
  return (
    <div className="page">
      {/* STEP 5: the nav becomes a glass bar floating just in front of the page. */}
      <nav enable-xr className="nav">
        <span className="brand">
          <span className="brand-mark" aria-hidden="true" />
          SWANFEST
        </span>
        <div className="nav-links">
          <a href="#features">Program</a>
          <a href="#schedule">Schedule</a>
          <a className="pico-btn nav-cta" href="#tickets">Get a pass</a>
        </div>
      </nav>

      <header className="hero">
        {/* STEP 5: the hero pops furthest forward. */}
        <div enable-xr className="hero-card">
          <p className="pico-eyebrow">A fictional PICO OS 6 developer day · Oct 17</p>
          <h1 className="pico-display hero-title">Build the web you can walk around.</h1>
          <p className="hero-lede">
            One day of hands-on WebSpatial: take a flat website and give it depth, glass and
            windows of its own.
          </p>
          <div className="hero-actions">
            <a className="pico-btn" href="#tickets">Get a pass</a>
            {/* STEP 6: open the schedule as its own window. */}
            <button className="pico-btn pico-btn--ghost" type="button" onClick={openSchedule}>
              See the schedule
            </button>
          </div>
        </div>
        <ul className="stats">
          {stats.map((s) => (
            <li key={s.label}>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </li>
          ))}
        </ul>
      </header>

      <section id="features" className="features">
        {features.map((f) => (
          // STEP 4: each card is spatialized: it floats with a glass back.
          <article key={f.tag} enable-xr className="feature pico-panel">
            <span className="pico-chip pico-chip--accent">{f.tag}</span>
            <h2 className="feature-title">{f.title}</h2>
            <p className="feature-body">{f.body}</p>
          </article>
        ))}
      </section>

      <section id="schedule" className="schedule pico-panel">
        <h2 className="pico-display section-title">Schedule</h2>
        <ol className="schedule-list">
          {schedule.map((s) => (
            <li key={s.time}>
              <span className="slot-time">{s.time}</span>
              <span className="slot-title">{s.title}</span>
              <span className="pico-chip">{s.room}</span>
            </li>
          ))}
        </ol>
      </section>

      <footer id="tickets" className="footer">
        <p className="pico-display footer-title">Passes are free. Seats are limited.</p>
        <a className="pico-btn" href="#tickets">Reserve a seat</a>
      </footer>
    </div>
  )
}
