import { initScene } from '@webspatial/react-sdk'

// The game is the START scene: its size comes from xr_main_scene in the manifest, because
// the OS creates it before any of this code runs. New scenes are configured here, and the
// type is the third argument.

export type SceneName = 'hud' | 'halloffame'

export function registerScenes() {
  initScene(
    'hud',
    (prev) => ({ ...prev, defaultSize: { width: 360, height: 480 }, resizability: { minWidth: 300, minHeight: 380 } }),
    { type: 'window' },
  )
  initScene('halloffame', (prev) => ({ ...prev, defaultSize: { width: 420, height: 560 } }), { type: 'window' })
}

export function openScene(name: SceneName) {
  // The second argument MUST equal the initScene name, or the config is silently skipped.
  window.open(`${import.meta.env.BASE_URL}?scene=${name}`, name)
}

export function currentScene(): SceneName | 'game' {
  const s = new URLSearchParams(window.location.search).get('scene')
  return s === 'hud' || s === 'halloffame' ? s : 'game'
}
