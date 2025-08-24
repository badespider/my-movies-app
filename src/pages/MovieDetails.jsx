import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchMovieDetails, selectTrailer } from '../lib/api/tmdb.js'
import TrailerPlayer from '../components/TrailerPlayer.jsx'
import Carousel from '../components/Carousel.jsx'
import { isSaved as wlIsSaved, toggleWatchlist as wlToggle } from '../lib/watchlist.js'
import { getPrefetchedDetails } from '../lib/prefetch.js'
import { addRecentlyViewed } from '../lib/recent.js'
import { hasWatchlistBackend, isSavedBackend, toggleWatchlistBackend } from '../lib/backend/watchlist.js'
import { capture } from '../lib/analytics.js'

const IMG_BASE = 'https://image.tmdb.org/t/p'
const fmtRuntime = (min) => {
  if (!min && min !== 0) return ''
  const h = Math.floor(min / 60)
  const m = min % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

function SkeletonDetails() {
  return (
    <div className="animate-pulse">
      <div className="h-64 md:h-96 w-full bg-neutral-800" />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="h-8 w-2/3 bg-neutral-800 rounded mb-4" />
        <div className="h-4 w-1/2 bg-neutral-800 rounded mb-6" />
        <div className="h-20 w-full bg-neutral-800 rounded mb-6" />
        <div className="h-6 w-40 bg-neutral-800 rounded mb-3" />
        <div className="flex gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-24 h-36 bg-neutral-800 rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}

function ErrorCard({ onRetry }) {
  return (
    <div className="max-w-3xl mx-auto p-4 mt-6 bg-red-50 border border-red-200 rounded">
      <p className="text-red-800 mb-3">Something went wrong while loading this movie.</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      >
        Try again
      </button>
    </div>
  )
}

function CastStrip({ cast }) {
  const items = Array.isArray(cast) ? cast.slice(0, 10) : []
  if (!items.length) return null
  return (
    <section aria-label="Top cast" className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-lg font-semibold mb-3 text-white">Top cast</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map(p => {
          const img = p.profile_path ? `${IMG_BASE}/w185${p.profile_path}` : null
          return (
            <div key={p.cast_id || p.credit_id} className="min-w-[120px] w-28">
              <div className="w-28 h-36 bg-neutral-800 rounded overflow-hidden">
                {img
                  ? <img src={img} alt={p.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-neutral-400">No image</div>}
              </div>
              <div className="mt-2">
                <p className="text-sm font-semibold text-white truncate" title={p.name}>{p.name}</p>
                <p className="text-xs text-neutral-400 truncate" title={p.character}>{p.character}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function MovieDetails() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [_ignoredError, setError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const h1Ref = useRef(null)

  const doFetch = () => {
    setStatus('loading')
    setError(null)

    // If we have a prefetched payload, use it immediately
    const cached = getPrefetchedDetails(id)
    if (cached) {
      setData(cached)
      setStatus('ready')
      capture('movie_opened', { movie_id: id, source: 'prefetch' })
      return () => {}
    }

    const ctrl = new AbortController()
    fetchMovieDetails(id, ctrl.signal)
      .then((json) => {
        setData(json)
        setStatus('ready')
        // Analytics stub
        capture('movie_opened', { movie_id: id })
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return
        setError(err)
        setStatus('error')
      })
    return () => ctrl.abort()
  }

  useEffect(() => {
    const cancel = doFetch()
    return () => cancel?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Focus h1 when ready
  useEffect(() => {
    if (status === 'ready') {
      setTimeout(() => {
        try { h1Ref.current?.focus() } catch {}
      }, 0)
      // sync watchlist state when data is ready (prefer backend, fallback to localStorage)
      try {
        if (hasWatchlistBackend()) {
          isSavedBackend(id).then(setSaved).catch(() => setSaved(wlIsSaved(id)))
        } else {
          setSaved(wlIsSaved(id))
        }
      } catch {}
      // add to recently viewed
      try {
        addRecentlyViewed({
          movie_id: id,
          title: data?.title || '',
          poster_url: data?.poster_path ? `${IMG_BASE}/w342${data.poster_path}` : null,
        })
      } catch {}
    }
  }, [status, id, data])

  const trailerKey = useMemo(() => selectTrailer(data?.videos), [data])
  const year = data?.release_date ? new Date(data.release_date).getFullYear() : ''
  const runtime = fmtRuntime(data?.runtime)
  const rating = data?.vote_average ? Math.round(data.vote_average * 10) / 10 : null
  const genres = Array.isArray(data?.genres) ? data.genres.map(g => g.name).join(' • ') : ''
  const backdrop = data?.backdrop_path ? `${IMG_BASE}/w1280${data.backdrop_path}` : null
  const poster = data?.poster_path ? `${IMG_BASE}/w342${data.poster_path}` : null

  if (status === 'loading') return <SkeletonDetails />
  if (status === 'error') return <ErrorCard onRetry={doFetch} />

  return (
    <main id="main" className="text-white">
      {/* HERO */}
      <section className="relative w-full">
        {backdrop
          ? <img
              src={backdrop}
              alt=""
              aria-hidden="true"
              className="w-full h-64 md:h-96 object-cover"
            />
          : <div className="w-full h-64 md:h-96 bg-neutral-800" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="max-w-6xl mx-auto px-4 pb-4 flex gap-4 items-end">
            {poster && (
              <img
                src={poster}
                alt={`${data.title} poster`}
                className="hidden md:block w-32 h-48 object-cover rounded shadow-lg"
              />
            )}
            <div className="pb-2">
              <h1
                ref={h1Ref}
                tabIndex={-1}
                className="text-2xl md:text-4xl font-extrabold"
              >
                {data.title}
              </h1>
              <p className="text-sm md:text-base text-neutral-300 mt-1">
                {year ? `${year} • ` : ''}{runtime ? `${runtime} • ` : ''}{rating ? `⭐ ${rating}` : ''}{genres ? ` • ${genres}` : ''}
              </p>
              <div className="mt-3 flex gap-3">
                <TrailerPlayer
                  trailerKey={trailerKey}
                  onPlay={() => capture('trailer_play', { movie_id: id, video_key: trailerKey })}
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!data) return
                    setSaving(true)
                    try {
                      if (hasWatchlistBackend()) {
                        const next = await toggleWatchlistBackend({
                          movie_id: id,
                          title: data.title,
                          poster_url: data.poster_path ? `${IMG_BASE}/w342${data.poster_path}` : null,
                        })
                        if (typeof next === 'boolean') setSaved(next)
                        else setSaved(wlIsSaved(id))
                      } else {
                        const next = wlToggle({
                          movie_id: id,
                          title: data.title,
                          poster_url: data.poster_path ? `${IMG_BASE}/w342${data.poster_path}` : null,
                        })
                        setSaved(next)
                      }
                      capture('watchlist_toggle', { movie_id: id, saved: !saved })
                    } catch (e) {
                      // ignore
                    } finally {
                      setSaving(false)
                    }
                  }}
                  disabled={saving}
                  className={
                    'inline-flex items-center rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white ' +
                    (saved ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-white/10 text-white hover:bg-white/20')
                  }
                  aria-label={saved ? 'Remove from watchlist' : 'Add to watchlist'}
                  title={saved ? 'Remove from watchlist' : 'Add to watchlist'}
                >
                  {saved ? '♥ In Watchlist' : '☆ Watchlist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OVERVIEW */}
      {data.overview ? (
        <section className="max-w-6xl mx-auto px-4 py-6">
          <h2 className="sr-only">Overview</h2>
          <p className="text-neutral-200 leading-relaxed">{data.overview}</p>
        </section>
      ) : null}

      {/* CAST */}
      <CastStrip cast={data?.credits?.cast} />

      {/* RECOMMENDED & SIMILAR */}
      <Carousel title="Recommended" items={(data?.recommendations?.results || []).slice(0, 10)} />
      <Carousel title="Similar" items={(data?.similar?.results || []).slice(0, 10)} />
    </main>
  )
}

