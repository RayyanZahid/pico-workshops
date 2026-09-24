import { initScene } from '@webspatial/react-sdk'

// TODO (step 1): this registers 'viewer' as a flat 600x600 px window.
// Make it a 3D volume that is 0.6 m on every side.

export function registerScenes() {
  initScene(
    'viewer',
    (prev) => ({
      ...prev,
      defaultSize: { width: 600, height: 600 },
    }),
    { type: 'window' },
  )
}

export function openViewer() {
  window.open(`${import.meta.env.BASE_URL}?scene=viewer`, 'viewer')
}

export function currentScene(): 'viewer' | 'main' {
  return new URLSearchParams(window.location.search).get('scene') === 'viewer'
    ? 'viewer'
    : 'main'
}
