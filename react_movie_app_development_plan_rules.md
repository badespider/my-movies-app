# React Movie App — Development Plan & Rules

A structured, end‑to‑end plan distilled from your transcript. Follow the phases in order; each phase has clear tasks and a Definition of Done (DoD). Copy this into your repo as `README.md` and iterate.

---

## 0) Project Summary
**Goal:** Build a modern React app that discovers movies (TMDB), supports a debounced search, and surfaces a “Trending” list computed from real user searches stored in Appwrite. Ship it publicly.

**Outcomes:**
- Users can browse popular movies and search by title.
- Debounced search (one request per pause, not per keystroke).
- Trending section (Top 5) driven by aggregated search counts in Appwrite.
- Production deployment with SSL.

**Non‑goals (v1):** Auth, favorites/watchlist, pagination/infinite scroll, SSR/Next.js, analytics auth.

---

## 1) Tech Stack & Dependencies
- **Frontend:** React (18+; compatible with React 19), Vite, JSX, Hooks
- **Styling:** Tailwind CSS v4
- **API:** TMDB v3 (Discover + Search)
- **Backend-as-a-Service:** Appwrite Cloud (Databases)
- **Utilities:** `react-use` (optional) for `useDebounce` OR custom hook
- **Tooling:** ESLint + Prettier, Git (Conventional Commits), Node LTS
- **IDE:** WebStorm or VS Code

---

## 2) Architecture Overview
**Flow:**
1. User types in `<Search/>` (controlled input) → state `searchTerm` updates.
2. `debouncedSearchTerm` triggers `fetchMovies(query)` → TMDB response → renders `<MovieCard/>` grid.
3. If results exist, call `updateSearchCount(query, topResult)` → Appwrite metrics collection.
4. On app mount, `getTrendingMovies()` → render `<TrendingList/>` (Top 5 by `count` desc).

**State (App):**
- `movieList: Movie[]`
- `trending: TrendingMetric[]`
- `searchTerm: string`
- `debouncedSearchTerm: string`
- `isLoadingMovies: boolean`, `moviesError: string|null`
- (Optional) `isLoadingTrending`, `trendingError`

**Folder layout:**
```
src/
  components/
    Search.jsx
    Spinner.jsx
    MovieCard.jsx
    TrendingList.jsx
  lib/
    api/tmdb.js
    backend/appwrite.js
    hooks/useDebounce.js   # if not using react-use
  styles/index.css
  App.jsx
  main.jsx
public/
  hero.png
  hero-bg.png
  logo.png
  star.svg
  search.svg
  no-movie.png
```

---

## 3) Environment & Config
Create `.env.local` (never commit):
```
VITE_TMDB_API_KEY=YOUR_BEARER_TOKEN
VITE_APPWRITE_PROJECT_ID=...
VITE_APPWRITE_DATABASE_ID=...
VITE_APPWRITE_COLLECTION_ID=...
```
Ensure `.gitignore` includes `.env*`.

---

## 4) Database Schema (Appwrite)
**Database:** `movies`
**Collection:** `metrics`

**Attributes:**
- `search_term` (string, size ≤1000, required)
- `count` (integer, default 1)
- `poster_url` (string, required)
- `movie_id` (integer, required)

**Permissions (dev):** Any (read/write).  
**Permissions (prod):** Restrict; move writes behind an Appwrite Function or API key.

---

## 5) Coding Rules & Conventions
**React/Hooks**
- Props are read‑only; never mutate props or state.
- Use `setState(prev => ...)` for updates derived from previous values.
- Keep effects specific; always set dependency arrays correctly.
- Abort in‑flight fetches with `AbortController` on unmount.

**Styling**
- Prefer Tailwind utility classes; avoid inline styles except for dynamic one‑offs.
- Keep custom CSS in `styles/index.css` for fonts/utilities only.

**Data Fetching**
- Check `response.ok`; handle and surface errors.
- Guard queries: only search when `debouncedSearchTerm.length ≥ 2`.
- Use `encodeURIComponent(query)` for URL params.

**UX**
- Debounce at 500ms; show spinner for loading; show clear empty state and error messages.
- Keyboard accessible input; aria labels; visible focus rings.

**Git/Repo**
- Branches: `main` (protected), `feature/*`, `fix/*`.
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`.
- PRs require passing lint and build.

---

## 6) Workplan by Phase (with DoD)
### Phase 0 — Tooling & Scaffold
**Tasks**
- Install Node LTS, create Vite app (React + JS), init Git.
- Install Tailwind v4 plugin; configure in `vite.config` + `styles/index.css`.
- Add ESLint + Prettier; add scripts.
**DoD**: `npm run dev` serves starter; lint passes; repo pushed.

### Phase 1 — Global UI
**Tasks**
- Add fonts/utilities in `styles/index.css`.
- Build header/hero background and wrapper container.
**DoD**: Responsive on ≥360px; contrast AA.

### Phase 2 — Components
**Tasks**
- `<Search value onChange/>` (controlled input with icon).
- `<Spinner/>` (SVG spinner component).
- `<MovieCard movie/>` (poster, title, rating, language, year; lazy images).
**DoD**: Components are reusable and documented (JSDoc or comments).

### Phase 3 — TMDB Integration
**Tasks**
- `lib/api/tmdb.js`: `fetchMovies(query?)` using `fetch` + Bearer token; endpoints:
  - Discover: `/discover/movie?sort_by=popularity.desc`
  - Search: `/search/movie?query=...`
- In `App.jsx`: state for movies/loading/error; effect for initial discover.
**DoD**: Grid renders 20 cards; spinner shows; network errors handled.

### Phase 4 — Debounced Search
**Tasks**
- `searchTerm` in App; pass to `<Search/>`.
- Debounce via `react-use`’s `useDebounce` **or** custom `useDebounce` hook (500ms).
- Effect re‑fetches on `debouncedSearchTerm` (length ≥2); empty string returns discover list.
**DoD**: Only one request per pause; “No results” message on empty.

### Phase 5 — Appwrite Trending
**Tasks**
- Create Appwrite project/DB/collection/attributes; set dev permissions.
- `lib/backend/appwrite.js`:
  - `updateSearchCount(query, movie)`: list by `search_term`; if exists `count++`; else create doc with `poster_url` and `movie_id`.
  - `getTrendingMovies()`: list docs ordered by `count` desc, limit 5.
- In App: call `updateSearchCount` only when search returns ≥1 result; effect on mount loads trending; `<TrendingList items/>`.
**DoD**: Trending list updates correctly after repeated searches; app doesn’t break if Appwrite is down.

### Phase 6 — Polish & Accessibility
**Tasks**
- Input `aria-label`, button labels, keyboard focus.
- Lazy images (`loading="lazy"`), fixed `w500` image variant.
- Empty/error states for both Movies and Trending; retry button.
**DoD**: Lighthouse a11y ≥90; no console errors.

### Phase 7 — Deployment
**Tasks**
- `npm run build`; upload `dist/` to Hostinger `public_html` (or Netlify/Vercel).
- Configure SSL; verify public URL.
**DoD**: App is reachable over HTTPS; search & trending work in prod.

### Phase 8 — Post‑Launch
**Tasks (optional)**
- Add analytics event for searches; error reporting.
- Document setup in README with screenshots and .env template.
**DoD**: README is complete and reproducible.

---

## 7) Component Contracts
**`<Search value onChange/>`**
- Props: `value: string`, `onChange(next: string): void`
- Behavior: emits on every keystroke; parent applies debounce.

**`<MovieCard movie/>`**
- Props: `movie` (TMDB shape). Internally derive: `title`, `poster_path`, `vote_average`, `original_language`, `release_date`.
- Behavior: graceful fallback image when `poster_path` missing.

**`<TrendingList items/>`**
- Props: `items: Array<{ poster_url: string, count: number, search_term: string }>`
- Behavior: Renders rank (1..n) + poster; caps at 5.

**`<Spinner/>`**
- No props; centered SVG.

---

## 8) Pseudocode (key functions)
```js
// lib/api/tmdb.js
export async function fetchMovies(query = "", signal) {
  const BASE = "https://api.themoviedb.org/3";
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`,
  };
  const url = query && query.length >= 2
    ? `${BASE}/search/movie?query=${encodeURIComponent(query)}`
    : `${BASE}/discover/movie?sort_by=popularity.desc`;
  const res = await fetch(url, { headers, signal });
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  const data = await res.json();
  return data.results || [];
}
```
```js
// lib/backend/appwrite.js
import { Client, Databases, ID, Query } from "appwrite";

const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);
const db = new Databases(client);
const DB = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COL = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

export async function updateSearchCount(searchTerm, movie) {
  if (!searchTerm || !movie) return;
  const { poster_path, id } = movie;
  const poster_url = poster_path
    ? `https://image.tmdb.org/t/p/w500/${poster_path}`
    : "/no-movie.png";
  const existing = await db.listDocuments(DB, COL, [
    Query.equal("search_term", searchTerm),
  ]);
  if (existing.total > 0) {
    const doc = existing.documents[0];
    await db.updateDocument(DB, COL, doc.$id, { count: doc.count + 1 });
  } else {
    await db.createDocument(DB, COL, ID.unique(), {
      search_term: searchTerm,
      count: 1,
      poster_url,
      movie_id: id,
    });
  }
}

export async function getTrendingMovies() {
  const res = await db.listDocuments(DB, COL, [
    Query.orderDesc("count"),
    Query.limit(5),
  ]);
  return res.documents;
}
```
```js
// lib/hooks/useDebounce.js  (only if not using react-use)
import { useEffect, useState } from "react";
export function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
```

---

## 9) Testing Plan (Happy paths & Edge cases)
**Happy paths**
- Initial discover fetch renders 20 MovieCards and no errors.
- Typing ≥2 chars triggers one request after 500ms and renders results.
- On successful search with results, Trending increments the top result.
- Trending loads Top 5 on mount and displays posters.

**Edge cases**
- TMDB network error → show error message + retry.
- Appwrite unavailable → suppress errors, show empty Trending with helper text.
- Movie without `poster_path` → fallback image displays.
- Query with 0 results → explicit “No results for ‘X’”.
- Rapid typing → verify only one network call per pause (Chrome DevTools).

---

## 10) Definition of Done (per feature)
- Code linted/formatted; no console errors.
- States cover loading, success, empty, error.
- A11y: labels, roles, focus; images have `alt`.
- Network: guards, response checks, abort on unmount.
- Readme updated; .env.example updated.

---

## 11) Deployment Checklist
- [ ] `npm run build` produces `/dist`
- [ ] Upload `/dist` to Hostinger `public_html` (or deploy to Netlify/Vercel)
- [ ] SSL enabled; domain resolves to HTTPS
- [ ] Environment vars configured in prod build (where applicable)
- [ ] Manual smoke test of search + trending

---

## 12) Roadmap (Post‑v1)
- Migrate to **Next.js** (server components, caching, SEO, image optimization)
- Add pagination/infinite scroll
- Saved favorites (auth) with Appwrite Auth
- Local cache (SWR/React Query)
- State mgmt (Zustand or Redux Toolkit) if complexity grows
- CI/CD with GitHub Actions; Vitest component tests
- Optional **React Native** app (Expo) using the same TMDB/Appwrite logic

---

## 13) Sample Tasks (copy into Issues)
- [ ] Scaffold Vite + Tailwind v4
- [ ] Build header/hero & wrapper
- [ ] Implement `<Search/>` (controlled)
- [ ] Implement `fetchMovies` + initial discover
- [ ] Implement `<MovieCard/>` grid
- [ ] Add spinner + loading states
- [ ] Debounce search (hook or `react-use`)
- [ ] Create Appwrite project/DB/collection
- [ ] Implement `updateSearchCount` & `getTrendingMovies`
- [ ] Build `<TrendingList/>`
- [ ] Error/empty states + retry
- [ ] Deploy to production + README

---

### Quick References
- **TMDB image URL:** `https://image.tmdb.org/t/p/w500/${poster_path}`
- **Search threshold:** `query.length >= 2`
- **Debounce delay:** `500ms`
- **Trending size:** `5`

> Follow this plan top‑to‑bottom. Each phase is shippable; you can pause after any DoD and still have a working build.

