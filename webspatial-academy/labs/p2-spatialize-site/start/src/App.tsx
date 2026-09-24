import { features, schedule, stats } from './data'

export function App() {
  return (
    <div className="page">
      <nav className="nav">
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
        <div className="hero-card">
          <p className="pico-eyebrow">A fictional PICO OS 6 developer day · Oct 17</p>
          <h1 className="pico-display hero-title">Build the web you can walk around.</h1>
          <p className="hero-lede">
            One day of hands-on WebSpatial: take a flat website and give it depth, glass and
            windows of its own.
          </p>
          <div className="hero-actions">
            <a className="pico-btn" href="#tickets">Get a pass</a>
            <a className="pico-btn pico-btn--ghost" href="#schedule">See the schedule</a>
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
          <article key={f.tag} className="feature pico-panel">
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
