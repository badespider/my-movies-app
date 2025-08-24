export async function fetchMovies(query = "", signal) {
  const BASE = "https://api.themoviedb.org/3"
  const token = import.meta.env.VITE_TMDB_API_KEY
  if (!token) {
    throw new Error("Missing VITE_TMDB_API_KEY. Create .env.local with your TMDB Bearer token.")
  }

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  }

  const url = query && query.length >= 2
    ? `${BASE}/search/movie?query=${encodeURIComponent(query)}`
    : `${BASE}/discover/movie?sort_by=popularity.desc`

  const res = await fetch(url, { headers, signal })
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`)
  const data = await res.json()
  return data.results || []
}

// --- Details API additions ---
/**
 * Fetch detailed movie info with appended bundles (videos, credits, recommendations, release_dates, images)
 * @param {string|number} id
 * @param {AbortSignal=} signal
 */
export async function fetchMovieDetails(id, signal) {
  const token = import.meta.env.VITE_TMDB_API_KEY
  if (!token) {
    throw new Error("Missing VITE_TMDB_API_KEY. Create .env.local with your TMDB Bearer token.")
  }
  const url = new URL(`https://api.themoviedb.org/3/movie/${id}`)
  url.searchParams.set('append_to_response', 'videos,credits,recommendations,release_dates,images')
  url.searchParams.set('language', 'en-US')

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    signal,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`TMDB details error ${res.status}: ${text}`)
  }
  return res.json()
}

/**
 * Pick a YouTube trailer key from TMDB videos payload.
 * Prefers official Trailer, then any Trailer, then Teaser.
 * @param {{ results?: any[] }|undefined|null} videos
 * @returns {string|null}
 */
export function selectTrailer(videos) {
  const list = Array.isArray(videos?.results) ? videos.results : []
  const isYT = (v) => v?.site === 'YouTube'
  const trailers = list.filter(v => isYT(v) && v?.type === 'Trailer')
  const teasers = list.filter(v => isYT(v) && v?.type === 'Teaser')
  const pick = trailers.find(v => v?.official) || trailers[0] || teasers[0] || null
  return pick ? pick.key : null
}

// --- Paged Search & Discover ---
export async function fetchSearchMoviesPaged(query, page = 1, signal) {
  const token = import.meta.env.VITE_TMDB_API_KEY
  if (!token) throw new Error("Missing VITE_TMDB_API_KEY.")
  const url = new URL('https://api.themoviedb.org/3/search/movie')
  url.searchParams.set('query', String(query || ''))
  url.searchParams.set('page', String(page))
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    signal,
  })
  if (!res.ok) throw new Error(`TMDB search error: ${res.status}`)
  const data = await res.json()
  return { results: data.results || [], page: data.page || 1, total_pages: data.total_pages || 1, total_results: data.total_results || 0 }
}

export async function fetchDiscoverMoviesPaged(filters = {}, page = 1, signal) {
  const token = import.meta.env.VITE_TMDB_API_KEY
  if (!token) throw new Error("Missing VITE_TMDB_API_KEY.")
  const url = new URL('https://api.themoviedb.org/3/discover/movie')
  const sort = filters.sort || 'popularity.desc'
  url.searchParams.set('sort_by', sort)
  if (filters.genre) url.searchParams.set('with_genres', String(filters.genre))
  if (filters.year) url.searchParams.set('primary_release_year', String(filters.year))
  url.searchParams.set('include_adult', 'false')
  url.searchParams.set('page', String(page))
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    signal,
  })
  if (!res.ok) throw new Error(`TMDB discover error: ${res.status}`)
  const data = await res.json()
  return { results: data.results || [], page: data.page || 1, total_pages: data.total_pages || 1, total_results: data.total_results || 0 }
}

// --- Genres & Discover (for filters) ---
export async function fetchGenres(signal) {
  const token = import.meta.env.VITE_TMDB_API_KEY
  if (!token) {
    throw new Error("Missing VITE_TMDB_API_KEY. Create .env.local with your TMDB Bearer token.")
  }
  const url = new URL('https://api.themoviedb.org/3/genre/movie/list')
  url.searchParams.set('language', 'en-US')
  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    signal,
  })
  if (!res.ok) throw new Error(`TMDB genres error: ${res.status}`)
  const data = await res.json()
  return data.genres || []
}

/**
 * Discover movies with optional filters.
 * filters: { genre?: string|number, sort?: string, year?: string|number }
 */
export async function fetchDiscoverMovies(filters = {}, signal) {
  const token = import.meta.env.VITE_TMDB_API_KEY
  if (!token) {
    throw new Error("Missing VITE_TMDB_API_KEY. Create .env.local with your TMDB Bearer token.")
  }
  const url = new URL('https://api.themoviedb.org/3/discover/movie')
  const sort = filters.sort || 'popularity.desc'
  url.searchParams.set('sort_by', sort)
  if (filters.genre) url.searchParams.set('with_genres', String(filters.genre))
  if (filters.year) url.searchParams.set('primary_release_year', String(filters.year))
  url.searchParams.set('include_adult', 'false')
  url.searchParams.set('page', '1')

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    signal,
  })
  if (!res.ok) throw new Error(`TMDB discover error: ${res.status}`)
  const json = await res.json()
  return json.results || []
}

