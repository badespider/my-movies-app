# Movie App – Details View, Trailer Playback & Modern Streaming Features

> Version: v1.0 (initial plan)  
> Target: ship Details + Trailer (v1.1), then Modern Extras (v1.2)

---

## 0) Snapshot (so this plan fits your code now)
- Search/browse results grid already renders movie cards (poster/title/rating).
- No router (or only basic). We’ll introduce `react-router-dom` and a `/movie/:id` route.
- API module already fetches lists; we’ll extend it with Movie **Details** + **Videos** + **Credits**.

> If any of the above differ, keep the milestones but adjust file names/paths to match your repo.

---

## 1) Scope & Milestones

### Milestone A — Details & Trailer (v1.1)
**User story:** “When I click a movie, I see a details page with description, cast, and I can play the trailer if available.”

**Acceptance**
- Clicking a card navigates to `/movie/:id`.
- Page shows: title, year, runtime, genres, rating, overview, poster/backdrop.
- Trailer button: inline YouTube player if a trailer exists; otherwise show disabled state with a hint.
- Proper loading skeletons + empty/error states; keyboard/screen-reader labels included.

**Out of scope:** real streaming, subtitles, auth.

### Milestone B — Modern Streaming Extras (v1.2)
- **Watchlist** — anonymous users can save/unsave titles (Appwrite or your backend of choice).
- **Recently viewed** — localStorage list of last 10 titles.
- **Recommendations & Similar** — horizontal carousels on the details page.
- **Filter bar on home** — genre chips + year + sort.

---

## 2) Routing & Navigation

**Install**
```bash
npm i react-router-dom
```

**App wiring**
- Wrap the app in `<BrowserRouter>` and define routes:
  - `/` → current home/search grid
  - `/movie/:id` → new `<MovieDetails/>`
- Make each `MovieCard` clickable: root becomes `<Link to={'/movie/' + movie.id}>…</Link>`.

**Optional (Netflix-style modal):** keep the URL route but open the details as a modal layered over the grid when navigating from home; closing modal returns to `/`.

**Done when**
- Deep link like `/movie/550` loads directly (refresh works).
- Back/forward browser buttons behave.
- Focus moves to the details `<h1>` on load (a11y).

---

## 3) TMDB API Additions

Extend your `tmdb.js` with:

- **`fetchMovieDetails(id, signal)`**
  - `GET /movie/{id}?append_to_response=videos,credits,recommendations,release_dates,images`
  - Parse:
    - Basic details (title, overview, poster, backdrop, runtime, genres)
    - Country rating (from `release_dates.results`)
    - Top 10 cast (from `credits.cast`)
    - **Videos**: prefer YouTube trailer
    - Similar & recommendations arrays

- **`selectTrailer(videos)`**
  - Strategy: find first `site === 'YouTube'` with type `Trailer` (fallback to `Teaser`). Return `{ key, name }`.

- **(Optional) `fetchGenres()`** → `GET /genre/movie/list` for filter chips.

**Resilience**
- Use `AbortController` so route changes cancel in-flight requests.
- Surface friendly errors with a retry button.

---

## 4) New UI Components

- `pages/MovieDetails.jsx` (or `components/movie/MovieDetails.jsx`)
- `components/TrailerPlayer.jsx`
- `components/PeopleStrip.jsx` (cast)
- `components/Carousel.jsx` (horizontal scroll for Similar & Recommended)

### MovieDetails layout
- **Hero**: backdrop with gradient overlay; show title, release year, runtime, rating, primary genres.
- **Actions**: `Play trailer` button, `Add to Watchlist` button.
- **Body**: overview text, genre chips, cast strip, two carousels (“Recommended”, “Similar”).

### TrailerPlayer
- If `selectTrailer` returns a key, render privacy‑enhanced embed:
  - `https://www.youtube-nocookie.com/embed/${key}?autoplay=1&rel=0`
- Lazy render (don’t mount iframe until user clicks). Show poster or thumbnail beforehand.
- If no trailer: keep button disabled with tooltip like “No official trailer found”.

### States & A11y
- Loading skeletons for hero/text/trailer.
- Error card with retry.
- Modal trailer traps focus; ESC closes; `aria-labelledby` wired to the trailer title.

---

## 5) Watchlist (v1.2)

**Backend choice**: Appwrite (or keep it simple with localStorage first). For Appwrite:

**Collection:** `watchlist`
- Fields: `movie_id:int`, `title:string`, `poster_url:string`, `added_at:datetime`, `owner:string` (user id)
- Index: unique on (`owner`, `movie_id`)

**Client helpers**
- `getWatchlist(owner)`
- `toggleWatchlist(movie, owner)`
- `isSaved(movie_id, owner)`

**UI hooks**
- Heart button in `MovieDetails` and optionally on `MovieCard`.
- Optimistic toggle with rollback on error; disable while request is in flight.

---

## 6) Recommendations, Similar & Filters (v1.2)

**Recommendations & Similar**
- From `details.recommendations.results` and `details.similar.results`.
- Show top 10 each in horizontally scrolling carousels.

**Filters on Home**
- Genre chips from `/genre/movie/list`.
- URL‑synced params (for discover endpoint): `with_genres`, `sort_by`, `primary_release_year`.
- Example: `?genre=28&sort=popularity.desc&year=2023`.

---

## 7) Analytics (minimum viable)

| Event | When | Properties | KPI |
|---|---|---|---|
| `movie_opened` | Details route mounts | `movie_id`, `source: 'grid'|'direct'` | CTR |
| `trailer_play` | User clicks Play | `movie_id`, `video_key`, `position` | Engagement |
| `watchlist_toggle` | Save/unsave | `movie_id`, `saved:boolean` | Retention |

Start with `console.log` stubs; wire a real sink later.

---

## 8) Performance & A11y Guardrails
- Defer the trailer iframe until clicked (helps LCP/INP).
- Respect `prefers-reduced-motion` for hero/hover animations.
- Maintain a consistent pattern for loading → empty → error states across pages.
- Preload the details route chunk on hover/focus of a `MovieCard` (optional, with `rel="prefetch"`).

---

## 9) Concrete Tasks (copy/paste into issues)

**A1 — Router & Links**
- [ ] `npm i react-router-dom` and wrap app in `<BrowserRouter>`; add routes `/` and `/movie/:id`.
- [ ] Update `MovieCard` to wrap with `<Link to={'/movie/' + movie.id}>`.

**A2 — TMDB Details & Videos**
- [ ] Add `fetchMovieDetails(id, signal)` using `append_to_response=videos,credits,recommendations,release_dates,images`.
- [ ] Add `selectTrailer(videos)` util.

**A3 — Details Page**
- [ ] Create `MovieDetails.jsx` with hero, actions, overview, cast, similar/recommended.
- [ ] Add `TrailerPlayer.jsx` (lazy YouTube embed, modal or inline).
- [ ] Add loading skeletons + error state + empty states.

**B1 — Watchlist (Appwrite)**
- [ ] Create `watchlist` collection & unique index (owner + movie_id).
- [ ] Implement helpers: `toggleWatchlist`, `getWatchlist`, `isSaved`.
- [ ] Add heart button with optimistic UI.

**B2 — Recommendations & Similar**
- [ ] Two horizontal carousels from details payload (hide if empty).

**B3 — Filters**
- [ ] Genre chips + sort + year; reflect state in URL; call Discover with those params.

---

## 10) Acceptance Checklists

**Details & Trailer (v1.1)**
- [ ] Loading skeletons in place; cancel in-flight requests on route change.
- [ ] Keyboard: `Enter` on a card opens details; trailer modal traps focus; ESC closes.
- [ ] Deep links to `/movie/:id` work on refresh.

**Modern Extras (v1.2)**
- [ ] Watchlist persists per anonymous user (or localStorage fallback).
- [ ] Recommendations & Similar appear when data exists; sections hidden otherwise.
- [ ] Filters reflected in URL; back/forward retains state.

---

## 11) Nice-to-haves (later)
- Autoplay preview in the hero (muted, hover/focus triggered).
- People pages (click a cast member to see their movies).
- PWA install + offline shell for the home screen.

---

## Appendix — Example Code Skeletons

> These are starting points; adapt naming/paths to your repo.

### `tmdb.js`
```js
const TMDB_BASE = 'https://api.themoviedb.org/3';
const defaultHeaders = {
  accept: 'application/json',
  Authorization: `Bearer ${import.meta.env.VITE_TMDB_TOKEN}`,
};

export async function fetchMovieDetails(id, signal) {
  const url = `${TMDB_BASE}/movie/${id}?append_to_response=videos,credits,recommendations,release_dates,images`;
  const res = await fetch(url, { headers: defaultHeaders, signal });
  if (!res.ok) throw new Error(`TMDB details failed: ${res.status}`);
  const json = await res.json();
  return json;
}

export function selectTrailer(videos) {
  if (!videos?.results?.length) return null;
  const pick = videos.results.find(v => v.site === 'YouTube' && v.type === 'Trailer')
           || videos.results.find(v => v.site === 'YouTube' && v.type === 'Teaser');
  return pick ? { key: pick.key, name: pick.name } : null;
}
```

### `MovieDetails.jsx`
```jsx
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchMovieDetails, selectTrailer } from '../lib/tmdb';
import TrailerPlayer from '../components/TrailerPlayer';

export default function MovieDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true); setError(null);
    fetchMovieDetails(id, ctrl.signal)
      .then(json => setData(json))
      .catch(err => { if (err.name !== 'AbortError') setError(err); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [id]);

  const trailer = useMemo(() => selectTrailer(data?.videos), [data]);

  if (loading) return <SkeletonDetails/>;
  if (error) return <ErrorCard retryMsg="Retry" onRetry={() => window.location.reload()} />;

  return (
    <main aria-labelledby="movie-title">
      <HeroBackdrop backdropPath={data.backdrop_path} />
      <section className="container">
        <h1 id="movie-title">{data.title} ({new Date(data.release_date).getFullYear()})</h1>
        <Meta runtime={data.runtime} rating={data.vote_average} genres={data.genres} />
        <p className="overview">{data.overview}</p>
        <div className="actions">
          <TrailerPlayer trailerKey={trailer?.key} disabled={!trailer} />
          <WatchlistButton movie={data} />
        </div>
        <PeopleStrip cast={data.credits?.cast?.slice(0,10) || []} />
        <Carousel title="Recommended" items={data.recommendations?.results || []} />
        <Carousel title="Similar" items={data.similar?.results || []} />
      </section>
    </main>
  );
}
```

### `TrailerPlayer.jsx` (inline)
```jsx
export default function TrailerPlayer({ trailerKey, disabled }) {
  const [open, setOpen] = useState(false);
  if (disabled) return <button disabled title="No official trailer found">Trailer</button>;
  return (
    <>
      <button onClick={() => setOpen(true)} aria-haspopup="dialog">Play trailer</button>
      {open && (
        <div role="dialog" aria-modal="true" className="modal">
          <button className="close" onClick={() => setOpen(false)} aria-label="Close">×</button>
          <div className="video-wrap" style={{position:'relative', paddingTop:'56.25%'}}>
            <iframe
              title="Trailer"
              src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              style={{position:'absolute', inset:0, width:'100%', height:'100%'}}
            />
          </div>
        </div>
      )}
    </>
  );
}
```

---

**End of plan.**

