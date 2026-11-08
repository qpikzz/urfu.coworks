const APP_MOTION_TOKEN = '--dur-app'
const APP_MOTION_FALLBACK = 170

function parseDuration(value) {
  const match = /^([\d.]+)(ms|s)$/.exec(String(value).trim())

  if (!match) return null

  return match[2] === 's' ? Number(match[1]) * 1000 : Number(match[1])
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function appMotionDuration() {
  if (prefersReducedMotion()) return 0

  if (typeof document === 'undefined') return APP_MOTION_FALLBACK

  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(APP_MOTION_TOKEN)

  return parseDuration(value) ?? APP_MOTION_FALLBACK
}
