import { initScene } from '@webspatial/react-sdk'

// STEP 6: a second window.
//
// WebSpatial adds no "open a window" function. It extends window.open(url, target):
// the target string is matched against a name registered here with initScene, and
// that registration decides the new window's size (and type: 'window' or 'volume').
// In a desktop browser the same call just opens a tab, so nothing breaks.

export function registerScenes() {
  initScene(
    'schedule',
    (prev) => ({
      ...prev,
      defaultSize: { width: 520, height: 640 },
      resizability: { minWidth: 400, minHeight: 480 },
    }),
    { type: 'window' },
  )
}

export function openSchedule() {
  window.open(`${import.meta.env.BASE_URL}?scene=schedule`, 'schedule')
}

/** Which scene is this document? Every window loads the same app, so we route on the URL. */
export function currentScene(): 'schedule' | 'main' {
  return new URLSearchParams(window.location.search).get('scene') === 'schedule'
    ? 'schedule'
    : 'main'
}
