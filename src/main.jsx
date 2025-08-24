import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PostHogProvider } from 'posthog-js/react'
import './styles/index.css'
import App from './App.jsx'

const MovieDetails = lazy(() => import('./pages/MovieDetails.jsx'))
const Watchlist = lazy(() => import('./pages/Watchlist.jsx'))

const apiKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY || import.meta.env.VITE_POSTHOG_KEY
const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
  defaults: '2025-05-24',
}
const posthogEnabled = Boolean(apiKey)

const AppRoutes = (
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <Suspense fallback={<div />}> 
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
        <Route path="/watchlist" element={<Watchlist />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {posthogEnabled ? (
      <PostHogProvider apiKey={apiKey} options={options}>
        {AppRoutes}
      </PostHogProvider>
    ) : (
      AppRoutes
    )}
  </StrictMode>,
)
