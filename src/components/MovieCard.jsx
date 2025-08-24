/**
 * MovieCard component
 * @param {{ movie: any }} props
 * Expects TMDB-like shape: { title, poster_path, vote_average, original_language, release_date }
 */
import { Link } from 'react-router-dom'
import { prefetchMovieDetails } from '../lib/prefetch.js'

export default function MovieCard({ movie }) {
  const title = movie?.title || movie?.name || 'Untitled'
  const year = movie?.release_date ? new Date(movie.release_date).getFullYear() : '—'
  const lang = (movie?.original_language || '').toUpperCase()
  const rating = movie?.vote_average ? movie.vote_average.toFixed(1) : '—'
  const poster = movie?.poster_path
    ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
    : '/no-movie.svg'

  return (
    <Link
      to={`/movie/${movie.id}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 rounded-lg"
      aria-label={`Open details for ${title}`}
      onMouseEnter={() => prefetchMovieDetails(movie.id)}
      onFocus={() => prefetchMovieDetails(movie.id)}
    >
      <article className="overflow-hidden rounded-lg border border-white/10 bg-neutral-900/40">
        <div className="aspect-[2/3] overflow-hidden bg-neutral-800">
          <img
            src={poster}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <div className="p-3">
          <h3 className="truncate text-sm font-medium" title={title}>
            {title}
          </h3>
          <div className="mt-1 flex items-center justify-between text-xs text-neutral-400">
            <span>{year}</span>
            <span>{lang}</span>
            <span className="inline-flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-4 text-amber-400"
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
}

