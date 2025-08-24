import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import Search from './components/Search.jsx'
import MovieCard from './components/MovieCard.jsx'
import TrendingList from './components/TrendingList.jsx'
import Spinner from './components/Spinner.jsx'
import { fetchGenres, fetchDiscoverMovies, fetchSearchMoviesPaged, fetchDiscoverMoviesPaged } from './lib/api/tmdb.js'
import { useDebounce } from './lib/hooks/useDebounce.js'
import { getTrendingMovies, updateSearchCount } from './lib/backend/appwrite.js'

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 500)
  const [searchParams, setSearchParams] = useSearchParams()

  const [movies, setMovies] = useState([])
  const [isLoadingMovies, setIsLoadingMovies] = useState(false)
  const [moviesError, setMoviesError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Filters state
  const [genres, setGenres] = useState([])
  const [genre, setGenre] = useState(() => searchParams.get('genre') || '') // TMDB genre id as string
  const [year, setYear] = useState(() => searchParams.get('year') || '')
  const [sort, setSort] = useState(() => searchParams.get('sort') || 'popularity.desc')

  const [trending, setTrending] = useState([])
  const [isLoadingTrending, setIsLoadingTrending] = useState(false)
  const [recent, setRecent] = useState([])

  const resultSuffix = debouncedSearch && debouncedSearch.length >= 2 ? ` for “${debouncedSearch}”` : ''
  const liveStatus = isLoadingMovies
    ? 'Loading movies…'
    : moviesError
      ? 'Error loading movies'
      : `${movies.length} results${resultSuffix}`

  useEffect(() => {
    const ac = new AbortController()
    async function loadInitial() {
      setIsLoadingMovies(true)
      setMoviesError(null)
      try {
        // preload genres for filters
        fetchGenres(ac.signal).then(setGenres).catch(() => {})
        const useSearch = debouncedSearch && debouncedSearch.length >= 2
        const page1 = 1
        if (useSearch) {
          const data = await fetchSearchMoviesPaged(debouncedSearch, page1, ac.signal)
          setMovies(data.results)
          setPage(data.page)
          setTotalPages(data.total_pages)
          if (data.results && data.results.length > 0) {
            updateSearchCount(debouncedSearch, data.results[0])
            getTrendingMovies().then(setTrending).catch(() => {})
          }
        } else {
          const data = await fetchDiscoverMoviesPaged({ sort, genre, year }, page1, ac.signal)
          setMovies(data.results)
          setPage(data.page)
          setTotalPages(data.total_pages)
        }
      } catch (err) {
        if (err.name !== 'AbortError') setMoviesError(err.message || 'Failed to load movies')
      } finally {
        setIsLoadingMovies(false)
      }
    }
    async function loadTrending() {
      setIsLoadingTrending(true)
      try {
        const docs = await getTrendingMovies()
        setTrending(docs)
      } catch (_) {
        // ignore; component shows empty trending if fails
      } finally {
        setIsLoadingTrending(false)
      }
    }
    loadInitial()
    loadTrending()
    // initial recent
    import('./lib/recent.js').then(mod => setRecent(mod.getRecentlyViewed(10))).catch(() => {})
    return () => ac.abort()
  }, [debouncedSearch, sort, genre, year])

  useEffect(() => {
    // Update document title to reflect current search
    document.title = debouncedSearch && debouncedSearch.length >= 2
      ? `My Movies — ${debouncedSearch}`
      : 'My Movies'
  }, [debouncedSearch])

  // Keep URL in sync with filters while not actively searching
  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length >= 2) return
    const next = new URLSearchParams()
    if (genre) next.set('genre', genre)
    if (year) next.set('year', year)
    if (sort) next.set('sort', sort)
    // Only update if changed
    const curr = searchParams.toString()
    const nextStr = next.toString()
    if (curr !== nextStr) setSearchParams(next, { replace: true })
  }, [genre, year, sort, debouncedSearch, searchParams, setSearchParams])

  // When URL changes (back/forward), reflect into state if not searching
  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length >= 2) return
    const pGenre = searchParams.get('genre') || ''
    const pYear = searchParams.get('year') || ''
    const pSort = searchParams.get('sort') || 'popularity.desc'
    if (genre !== pGenre) setGenre(pGenre)
    if (year !== pYear) setYear(pYear)
    if (sort !== pSort) setSort(pSort)
  }, [searchParams, debouncedSearch])

  // Load more via IntersectionObserver
  const [sentinel, setSentinel] = useState(null)
  useEffect(() => {
    if (!sentinel) return
    if (isLoadingMovies) return
    const obs = new IntersectionObserver(async (entries) => {
      const first = entries[0]
      if (!first?.isIntersecting) return
      if (isLoadingMore) return
      const useSearch = debouncedSearch && debouncedSearch.length >= 2
      if (page >= totalPages) return
      setIsLoadingMore(true)
      try {
        const nextPage = page + 1
        if (useSearch) {
          const data = await fetchSearchMoviesPaged(debouncedSearch, nextPage)
          setMovies((prev) => prev.concat(data.results || []))
          setPage(data.page)
          setTotalPages(data.total_pages)
        } else {
          const data = await fetchDiscoverMoviesPaged({ sort, genre, year }, nextPage)
          setMovies((prev) => prev.concat(data.results || []))
          setPage(data.page)
          setTotalPages(data.total_pages)
        }
      } catch (_) {
        // ignore transient errors
      } finally {
        setIsLoadingMore(false)
      }
    }, { rootMargin: '200px' })
    obs.observe(sentinel)
    return () => obs.disconnect()
  }, [sentinel, isLoadingMovies, isLoadingMore, page, totalPages, debouncedSearch, sort, genre, year])

  async function reloadDiscover() {
    setIsLoadingMovies(true)
    setMoviesError(null)
    try {
      const results = await fetchDiscoverMovies({ sort, genre, year })
      setMovies(results)
    } catch (err) {
      setMoviesError(err.message || 'Failed to load movies')
    } finally {
      setIsLoadingMovies(false)
    }
  }

  async function refreshTrending() {
    setIsLoadingTrending(true)
    try {
      const docs = await getTrendingMovies()
      setTrending(docs)
    } catch (_) {
      // ignore errors; UI remains usable
    } finally {
      setIsLoadingTrending(false)
    }
  }

  // Refresh recent when navigating back from details
  useEffect(() => {
    const onPop = () => {
      import('./lib/recent.js').then(mod => setRecent(mod.getRecentlyViewed(10))).catch(() => {})
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="border-b border-white/10 bg-neutral-950/60 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/40">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 rounded">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6 text-rose-400"
              aria-hidden="true"
            >
              <path d="M4.5 3.75a.75.75 0 0 0-.75.75v15a.75.75 0 0 0 1.133.65l4.867-3.042 4.867 3.043a.75.75 0 0 0 1.133-.65v-15a.75.75 0 0 0-.75-.75h-10.5Z" />
            </svg>
            <span className="text-lg font-semibold tracking-tight">My Movies</span>
          </a>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-neutral-300">
            <a className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 rounded" href="#discover">Discover</a>
            <a className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 rounded" href="#trending">Trending</a>
            <a className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 rounded" href="#about">About</a>
            <Link className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 rounded" to="/watchlist">Watchlist</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section id="discover" className="relative isolate">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(75%_75%_at_50%_0%,rgba(244,63,94,0.15)_0%,rgba(0,0,0,0)_60%)]"
        />
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Discover your next favorite movie
            </h1>
            <p className="mt-4 text-neutral-300">
              Browse popular titles, search instantly with debounce, and see what people are
              searching for in real time.
            </p>
            <div className="mt-8 max-w-xl">
              <Search value={searchTerm} onChange={setSearchTerm} />
              {/* Live region for screen readers */}
              <p className="sr-only" aria-live="polite" aria-atomic="true">{liveStatus}</p>
            </div>
            {/* Filters */}
            {!searchTerm || searchTerm.length < 2 ? (
              <div className="mt-6">
                <Filters
                  genres={genres}
                  genre={genre}
                  setGenre={setGenre}
                  year={year}
                  setYear={setYear}
                  sort={sort}
                  setSort={setSort}
                />
              </div>
            ) : null}
            <div className="mt-8 flex items-center gap-3 text-sm text-neutral-400">
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-400" />
                Live search
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="size-2 rounded-full bg-sky-400" />
                Trending Top 5
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Page container */}
      <main className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr]">
          <section aria-labelledby="movies-heading">
            <h2 id="movies-heading" className="sr-only">
              Movies
            </h2>
            <div className="rounded-lg border border-white/10 p-6" aria-busy={isLoadingMovies}>
              {isLoadingMovies ? (
                <div className="min-h-48 flex items-center justify-center gap-2 text-neutral-400">
                  <Spinner />
                  <span>Loading movies…</span>
                </div>
              ) : moviesError ? (
                <div className="space-y-3">
                  <p className="text-sm text-rose-400">Failed to load movies: {moviesError}</p>
                  <button
                    type="button"
                    onClick={reloadDiscover}
                    className="inline-flex items-center gap-2 rounded-md bg-rose-500/20 px-3 py-1.5 text-sm text-rose-200 hover:bg-rose-500/30"
                  >
                    Retry
                  </button>
                </div>
              ) : movies.length === 0 ? (
                <p className="text-neutral-400">
                  {debouncedSearch && debouncedSearch.length >= 2
                    ? `No results for “${debouncedSearch}”.`
                    : 'No movies found.'}
                </p>
              ) : (
                <>
                  <div id="movies-grid" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {movies.map((m, idx) => (
                      <MovieCard key={`${m.id}-${idx}`} movie={m} />
                    ))}
                  </div>
                  <div className="mt-6 flex items-center justify-center">
                    {isLoadingMore ? (
                      <div className="flex items-center gap-2 text-neutral-400"><Spinner /><span>Loading more…</span></div>
                    ) : null}
                  </div>
                  <div ref={setSentinel} aria-hidden />
                </>
              )}
            </div>
          </section>
          <aside id="trending" aria-labelledby="trending-heading">
            <h2 id="trending-heading" className="sr-only">
              Trending
            </h2>
            <div className="rounded-lg border border-white/10 p-6" aria-busy={isLoadingTrending}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-200">Trending</h3>
                <button
                  type="button"
                  onClick={refreshTrending}
                  disabled={isLoadingTrending}
                  className="inline-flex items-center gap-2 rounded-md border border-white/10 px-2.5 py-1 text-xs text-neutral-200 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                  aria-label="Refresh trending"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-4">
                    <path d="M20 12a8 8 0 1 1-2.343-5.657" strokeWidth="1.5"/>
                    <path d="M20 4v6h-6" strokeWidth="1.5"/>
                  </svg>
                  Refresh
                </button>
              </div>
              {isLoadingTrending ? (
                <div className="flex items-center justify-center gap-2 text-neutral-400">
                  <Spinner />
                  <span>Loading trending…</span>
                </div>
              ) : (
                <TrendingList items={trending} />
              )}
            </div>

            {/* Recently viewed */}
            <div className="mt-6 rounded-lg border border-white/10 p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-200">Recently viewed</h3>
                <button
                  type="button"
                  onClick={() => import('./lib/recent.js').then(mod => setRecent(mod.getRecentlyViewed(10))).catch(() => {})}
                  className="inline-flex items-center gap-2 rounded-md border border-white/10 px-2.5 py-1 text-xs text-neutral-200 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                  aria-label="Refresh recently viewed"
                >
                  Refresh
                </button>
              </div>
              {recent.length === 0 ? (
                <p className="text-sm text-neutral-400">Nothing here yet. Open a movie to see it listed.</p>
              ) : (
                <ol className="space-y-3">
                  {recent.map((it) => (
                    <li key={it.movie_id} className="flex items-center gap-3">
                      <img
                        src={it.poster_url || '/no-movie.svg'}
                        alt={it.title}
                        className="size-10 shrink-0 rounded object-cover"
                        loading="lazy"
                      />
                      <Link
                        to={`/movie/${it.movie_id}`}
                        className="truncate text-sm text-neutral-200 hover:underline"
                      >
                        {it.title}
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* About */}
      <section id="about" className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-xl font-semibold">About</h2>
        <p className="mt-3 text-neutral-300 max-w-3xl">
          My Movies is a demo app built with React, Vite and Tailwind. It showcases TMDB-powered discovery,
          details pages with trailers, watchlist, recommendations, filters with URL sync, and accessibility-minded UI.
          This project uses PostHog for analytics and supports Appwrite for backend-powered watchlists.
        </p>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-neutral-400">
          Built with React + Vite + Tailwind
        </div>
      </footer>
    </div>
  )
}

function Filters({ genres = [], genre, setGenre, year, setYear, sort, setSort }) {
  const sorts = [
    { value: 'popularity.desc', label: 'Popularity' },
    { value: 'vote_average.desc', label: 'Rating' },
    { value: 'primary_release_date.desc', label: 'Newest' },
  ]
  const years = Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i)

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {/* Genre chips */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setGenre('')}
          className={`rounded-full px-3 py-1 border ${!genre ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 text-neutral-300 hover:bg-white/5'}`}
        >
          All genres
        </button>
        {genres.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGenre(String(g.id) === genre ? '' : String(g.id))}
            className={`rounded-full px-3 py-1 border ${String(g.id) === genre ? 'bg-rose-600 border-rose-500 text-white' : 'border-white/10 text-neutral-300 hover:bg-white/5'}`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* Year */}
      <div className="ml-auto flex items-center gap-2 min-w-[220px]">
        <label className="text-neutral-300">Year</label>
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="rounded-md border border-white/10 bg-neutral-900/70 px-2 py-1 text-sm"
        >
          <option value="">Any</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {/* Sort */}
        <label className="text-neutral-300">Sort</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-md border border-white/10 bg-neutral-900/70 px-2 py-1 text-sm"
        >
          {sorts.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default App
