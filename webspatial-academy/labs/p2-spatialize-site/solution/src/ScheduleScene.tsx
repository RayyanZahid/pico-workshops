import { schedule } from './data'

// The second window. Same data as the section on the main page, laid out for a
// narrow standalone panel. The window itself is glass; the rows stay flat on it (six
// spatial rows came up as empty glass in the PICO OS 6.0.0 emulator, 2026-09-24).
export function ScheduleScene() {
  return (
    <main className="scene-schedule">
      <p className="pico-eyebrow">Swanfest · Oct 17</p>
      <h1 className="pico-display section-title">Schedule</h1>
      <ol className="schedule-list">
        {schedule.map((s) => (
          <li key={s.time} className="slot">
            <span className="slot-time">{s.time}</span>
            <span className="slot-title">{s.title}</span>
            <span className="pico-chip">{s.room}</span>
          </li>
        ))}
      </ol>
    </main>
  )
}
