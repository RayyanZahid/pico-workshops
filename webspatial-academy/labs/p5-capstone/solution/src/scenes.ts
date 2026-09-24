import { initScene } from '@webspatial/react-sdk'

// Two extra scenes: a flat window per stall (replaces the modal in the headset) and a
// small volume of lanterns built from SDK primitives.

export type SceneName = 'stall' | 'lanterns'

export function registerScenes() {
  initScene(
    'stall',
    (prev) => ({ ...prev, defaultSize: { width: 420, height: 360 } }),
    { type: 'window' },
  )
  initScene(
    'lanterns',
    (prev) => ({ ...prev, defaultSize: { width: '0.6m', height: '0.5m', depth: '0.4m' } }),
    { type: 'volume' },
  )
}

export function openScene(name: SceneName, params?: Record<string, string>) {
  const query = new URLSearchParams({ scene: name, ...(params ?? {}) })
  window.open(`${import.meta.env.BASE_URL}?${query.toString()}`, name)
}

export function currentScene(): SceneName | 'main' {
  const scene = new URLSearchParams(window.location.search).get('scene')
  return scene === 'stall' || scene === 'lanterns' ? scene : 'main'
}
