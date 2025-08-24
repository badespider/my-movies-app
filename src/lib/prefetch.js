// Simple prefetch cache for movie details
// Not a full data layer; just enough to speed up first render after hover/focus

import { fetchMovieDetails } from './api/tmdb.js'

const detailsCache = new Map()

export function getPrefetchedDetails(id) {
  const key = String(id)
  return detailsCache.get(key) || null
}

export async function prefetchMovieDetails(id) {
  const key = String(id)
  if (!key || detailsCache.has(key)) return
  try {
    const data = await fetchMovieDetails(key)
    detailsCache.set(key, data)
  } catch (_) {
    // ignore network errors; page will fetch normally on navigation
  }
}

