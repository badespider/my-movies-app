// Lightweight localStorage-based watchlist for anonymous users
// Shape: { movie_id: number, title: string, poster_url: string|null, added_at: string }

const KEY = 'movieapp.watchlist';

function readRaw() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function writeRaw(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (_) {
    // ignore quota or serialization errors silently
  }
}

/**
 * Get the current watchlist (most recent first)
 * @returns {Array<{movie_id:number,title:string,poster_url:string|null,added_at:string}>}
 */
export function getWatchlist() {
  const list = readRaw();
  return list.slice().sort((a, b) => (b.added_at || '').localeCompare(a.added_at || ''));
}

/**
 * Check if a movie is saved in the watchlist
 * @param {number|string} movieId
 * @returns {boolean}
 */
export function isSaved(movieId) {
  const id = Number(movieId);
  return readRaw().some((x) => Number(x.movie_id) === id);
}

/**
 * Toggle a movie in the watchlist.
 * Pass minimal info: { movie_id, title, poster_url }
 * Returns the new saved state (true if now saved, false if removed).
 * @param {{movie_id:number|string,title:string,poster_url:string|null}} entry
 * @returns {boolean}
 */
export function toggleWatchlist(entry) {
  const id = Number(entry?.movie_id);
  if (!id) return false;
  const list = readRaw();
  const idx = list.findIndex((x) => Number(x.movie_id) === id);
  if (idx >= 0) {
    // remove
    list.splice(idx, 1);
    writeRaw(list);
    return false;
  }
  // add
  const item = {
    movie_id: id,
    title: String(entry?.title || ''),
    poster_url: entry?.poster_url ?? null,
    added_at: new Date().toISOString(),
  };
  list.push(item);
  writeRaw(list);
  return true;
}

