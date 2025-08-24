import posthog from 'posthog-js'

const enabled = Boolean(
  (import.meta.env.VITE_PUBLIC_POSTHOG_KEY || import.meta.env.VITE_POSTHOG_KEY)
)

export function capture(event, props = {}) {
  if (!enabled) return console.log(`[analytics stub] ${event}`, props)
  try { posthog.capture(event, props) } catch (_) {}
}

export function identify(id, props = {}) {
  if (!enabled) return
  try { posthog.identify(id, props) } catch (_) {}
}

