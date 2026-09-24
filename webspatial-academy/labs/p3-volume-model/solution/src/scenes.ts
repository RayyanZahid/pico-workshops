import { initScene } from '@webspatial/react-sdk'

// STEP 1: register the 3D window.
// type 'volume' makes a bounded 3D box instead of a flat panel. Volume sizes take
// metres as strings ('0.6m'); plain numbers mean px.

export function registerScenes() {
  initScene(
    'viewer',
    (prev) => ({
      ...prev,
      defaultSize: { width: '0.6m', height: '0.6m', depth: '0.6m' },
    }),
    { type: 'volume' },
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
