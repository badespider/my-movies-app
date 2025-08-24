// localStorage-based "Recently Viewed" (last 10)
// Item shape: { movie_id: number, title: string, poster_url: string|null, viewed_at: string }

const KEY = 'movieapp.recently_viewed';

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
    // ignore
  }
}

export function getRecentlyViewed(limit = 10) {
  const list = readRaw();
  return list
    .slice()
    .sort((a, b) => (b.viewed_at || '').localeCompare(a.viewed_at || ''))
    .slice(0, limit);
}

export function addRecentlyViewed(entry) {
  const id = Number(entry?.movie_id);
  if (!id) return;
  const list = readRaw();
  const filtered = list.filter(x => Number(x.movie_id) !== id);
  const item = {
    movie_id: id,
    title: String(entry?.title || ''),
    poster_url: entry?.poster_url ?? null,
    viewed_at: new Date().toISOString(),
  };
  filtered.unshift(item);
  writeRaw(filtered.slice(0, 10));
}

