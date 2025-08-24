/**
 * TrendingList component
 * @param {{ items: Array<{ poster_url: string, count: number, search_term: string }> }} props
 */
export default function TrendingList({ items = [] }) {
  if (!items.length) {
    return (
      <div className="text-sm text-neutral-400">No trending searches yet. Try searching!</div>
    )
  }
  return (
    <ol className="space-y-3">
      {items.map((it, idx) => (
        <li key={it.search_term + idx} className="flex items-center gap-3">
          <span className="inline-flex size-6 shrink-0 items-center justify-center rounded bg-neutral-800 text-xs text-neutral-300">
            {idx + 1}
          </span>
          <img
            src={it.poster_url || '/no-movie.svg'}
            alt={it.search_term}
            className="size-10 shrink-0 rounded object-cover"
            loading="lazy"
          />
          <div className="min-w-0">
            <p className="truncate text-sm text-neutral-200" title={it.search_term}>
              {it.search_term}
            </p>
            <p className="text-xs text-neutral-400">{it.count} searches</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

