import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Carousel for horizontal scrolling items of movie cards.
 * Expects items: Array of TMDB-like movies (id, title/name, poster_path, vote_average, release_date)
 */
export default function Carousel({ title, items = [] }) {
  const scrollRef = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)
  const safeId = (title || 'items').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  function updateArrows() {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanLeft(scrollLeft > 0)
    setCanRight(scrollLeft + clientWidth < scrollWidth - 1)
  }

  useEffect(() => {
    updateArrows()
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => updateArrows()
    el.addEventListener('scroll', onScroll, { passive: true })
    const onResize = () => updateArrows()
    window.addEventListener('resize', onResize)
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  if (!items || items.length === 0) return null

  function scrollByDir(dir) {
    const el = scrollRef.current
    if (!el) return
    const amount = Math.max(240, Math.floor(el.clientWidth * 0.9))
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: dir * amount, behavior: prefersReduced ? 'auto' : 'smooth' })
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-6" aria-labelledby={`carousel-${safeId}-title`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 id={`carousel-${safeId}-title`} className="text-lg font-semibold text-white">{title}</h2>
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            disabled={!canLeft}
            className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-neutral-200 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Scroll left"
            aria-controls={`carousel-${safeId}`}
          >
            ◀
          </button>
          <button
            type="button"
            onClick={() => scrollByDir(1)}
            disabled={!canRight}
            className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-neutral-200 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Scroll right"
            aria-controls={`carousel-${safeId}`}
          >
            ▶
          </button>
        </div>
      </div>
      <div className="relative">
        {/* Edge fades */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-neutral-950 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-neutral-950 to-transparent" />

        <div
          id={`carousel-${safeId}`}
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]"
          role="group"
          aria-label={`${title} list`}
        >
          {items.map((m) => {
            const name = m.title || m.name
            const poster = m.poster_path
              ? `https://image.tmdb.org/t/p/w342/${m.poster_path}`
              : '/no-movie.svg'
            const year = m.release_date ? new Date(m.release_date).getFullYear() : ''
            const rating = typeof m.vote_average === 'number' ? m.vote_average.toFixed(1) : '—'
            return (
              <Link
                key={m.id}
                to={`/movie/${m.id}`}
                className="group min-w-[160px] w-40 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 rounded"
                aria-label={`Open details for ${name}`}
              >
                <article className="overflow-hidden rounded-lg border border-white/10 bg-neutral-900/40">
                  <div className="aspect-[2/3] overflow-hidden bg-neutral-800">
                    <img
                      src={poster}
                      alt={name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2">
                    <h3 className="truncate text-xs font-medium" title={name}>
                      {name}
                    </h3>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-400">
                      <span>{year}</span>
                      <span className="inline-flex items-center gap-0.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="size-3 text-amber-400"
                          aria-hidden="true"
                        >
                          <path d="M11.48 3.499a.75.75 0 0 1 1.04 0l2.123 2.003a.75.75 0 0 0 .49.19h2.744a.75.75 0 0 1 .442 1.356l-2.123 2.003a.75.75 0 0 0-.248.73l.676 2.767a.75.75 0 0 1-1.128.82l-2.361-1.394a.75.75 0 0 0-.77 0L9.004 13.37a.75.75 0 0 1-1.127-.82l.676-2.767a.75.75 0 0 0-.248-.73L6.182 7.048a.75.75 0 0 1 .441-1.356h2.745a.75.75 0 0 0 .49-.19l2.123-2.003Z" />
                        </svg>
                        {rating}
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            )
          })}
        </div>

        {/* Floating controls for small screens */}
        <div className="absolute inset-y-0 left-0 flex items-center">
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            disabled={!canLeft}
            className="sm:hidden m-2 inline-flex items-center justify-center rounded-full bg-white/10 text-white p-2 backdrop-blur border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Scroll left"
            aria-controls={`carousel-${safeId}`}
          >
            ◀
          </button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center">
          <button
            type="button"
            onClick={() => scrollByDir(1)}
            disabled={!canRight}
            className="sm:hidden m-2 inline-flex items-center justify-center rounded-full bg-white/10 text-white p-2 backdrop-blur border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Scroll right"
            aria-controls={`carousel-${safeId}`}
          >
            ▶
          </button>
        </div>
      </div>
    </section>
  )
}

