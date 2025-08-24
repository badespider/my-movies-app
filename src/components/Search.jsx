/**
 * Search input component
 * @param {{ value: string, onChange: (next: string) => void }} props
 */
export default function Search({ value, onChange }) {
  return (
    <div className="w-full">
      <label htmlFor="movie-search" className="sr-only">
        Search movies
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 inline-flex items-center text-neutral-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-5">
            <circle cx="11" cy="11" r="7" strokeWidth="1.5" />
            <path d="m20 20-3.5-3.5" strokeWidth="1.5" />
          </svg>
        </span>
        <input
          id="movie-search"
          type="search"
          autoComplete="off"
          className="w-full rounded-md border border-white/10 bg-neutral-900/70 py-2 pl-10 pr-10 text-sm placeholder:text-neutral-500 outline-none focus:border-rose-400/50 focus:ring-2 focus:ring-rose-400/30"
          placeholder="Search movies..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Search movies"
          aria-describedby="search-help"
          aria-controls="movies-grid"
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute inset-y-0 right-2 inline-flex items-center rounded px-2 text-neutral-400 hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            onClick={() => onChange("")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-4">
              <path d="M6 6l12 12M18 6L6 18" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}
      </div>
      <p id="search-help" className="mt-2 text-xs text-neutral-400">Type at least 2 characters to search.</p>
    </div>
  )
}
