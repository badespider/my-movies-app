import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { hasWatchlistBackend, getWatchlistBackend, toggleWatchlistBackend } from '../lib/backend/watchlist.js'
import { getWatchlist as getWatchlistLocal, toggleWatchlist as toggleWatchlistLocal } from '../lib/watchlist.js'
import Spinner from '../components/Spinner.jsx'

export default function Watchlist() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      if (hasWatchlistBackend()) {
        const list = await getWatchlistBackend(100)
        setItems(list)
      } else {
        setItems(getWatchlistLocal())
      }
    } catch (e) {
      setError(e?.message || 'Failed to load watchlist')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function onToggle(it) {
    setBusyId(it.movie_id)
    try {
      if (hasWatchlistBackend()) {
        const next = await toggleWatchlistBackend({ movie_id: it.movie_id, title: it.title, poster_url: it.poster_url })
        if (next === false) {
          setItems((prev) => prev.filter(x => x.movie_id !== it.movie_id))
        } else if (next === true) {
          // unlikely here (page already has it), but refresh
          load()
        } else {
          // fallback
          load()
        }
      } else {
        const nowSaved = toggleWatchlistLocal({ movie_id: it.movie_id, title: it.title, poster_url: it.poster_url })
        if (!nowSaved) setItems((prev) => prev.filter(x => x.movie_id !== it.movie_id))
      }
    } catch (_) {
      // ignore; keep UI
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-100">
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-sm text-neutral-300 hover:text-white">← Back to Discover</Link>
          <h1 className="text-lg font-semibold">Your Watchlist</h1>
          <button
            type="button"
            onClick={load}
            className="text-sm text-neutral-300 hover:text-white"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-neutral-400"><Spinner /><span>Loading…</span></div>
        ) : error ? (
          <div className="space-y-3">
            <p className="text-sm text-rose-400">{error}</p>
            <button onClick={load} className="rounded-md bg-rose-500/20 px-3 py-1.5 text-sm text-rose-200 hover:bg-rose-500/30">Retry</button>
          </div>
        ) : items.length === 0 ? (
          <p className="text-neutral-300">No saved movies yet. Open a movie and click “☆ Watchlist” to save it.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((it) => (
              <article key={it.movie_id} className="group overflow-hidden rounded-lg border border-white/10 bg-neutral-900/40">
                <Link to={`/movie/${it.movie_id}`} className="block">
                  <div className="aspect-[2/3] overflow-hidden bg-neutral-800">
                    <img
                      src={it.poster_url || '/no-movie.svg'}
                      alt={it.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                </Link>
                <div className="p-3 flex items-center justify-between gap-2">
                  <Link to={`/movie/${it.movie_id}`} className="truncate text-sm font-medium hover:underline" title={it.title}>
                    {it.title}
                  </Link>
                  <button
                    type="button"
                    onClick={() => onToggle(it)}
                    disabled={busyId === it.movie_id}
                    className="inline-flex items-center rounded-md border border-white/10 px-2 py-1 text-xs text-neutral-200 hover:bg-white/5 disabled:opacity-50"
                    aria-label="Remove from watchlist"
                    title="Remove from watchlist"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

