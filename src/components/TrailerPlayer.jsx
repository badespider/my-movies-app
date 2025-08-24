import { useEffect, useRef, useState } from 'react'

/**
 * TrailerPlayer
 * Props:
 * - trailerKey: string|null
 * - disabled: boolean (optional)
 * - onPlay: function (optional analytics hook)
 */
export default function TrailerPlayer({ trailerKey, disabled = false, onPlay }) {
  const [open, setOpen] = useState(false)
  const modalRef = useRef(null)
  const closeBtnRef = useRef(null)
  const lastFocusedRef = useRef(null)

  const canPlay = !!trailerKey && !disabled

  function openModal() {
    if (!canPlay) return
    lastFocusedRef.current = document.activeElement
    setOpen(true)
    if (typeof onPlay === 'function') {
      onPlay({ video_key: trailerKey })
    }
  }

  function closeModal() {
    setOpen(false)
    if (lastFocusedRef.current && typeof lastFocusedRef.current.focus === 'function') {
      try { lastFocusedRef.current.focus() } catch {}
    }
  }

  // Lock scroll and focus trap when open
  useEffect(() => {
    if (!open) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeModal()
        return
      }
      if (e.key === 'Tab') {
        const root = modalRef.current
        if (!root) return
        const focusable = root.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    // focus close button when open
    setTimeout(() => {
      closeBtnRef.current?.focus()
    }, 0)

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div>
      <button
        type="button"
        onClick={openModal}
        disabled={!canPlay}
        className={
          'inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition ' +
          (canPlay
            ? 'bg-red-600 text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500'
            : 'bg-gray-300 text-gray-600 cursor-not-allowed')
        }
        title={canPlay ? 'Play trailer' : 'No official trailer found'}
        aria-disabled={!canPlay}
        aria-label="Play trailer"
      >
        ▶ Play trailer
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Trailer player"
        >
          <div
            className="fixed inset-0 bg-black/70"
            onClick={closeModal}
          />
          <div
            ref={modalRef}
            className="relative z-10 w-full max-w-5xl mx-4 bg-black rounded-lg shadow-lg overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-2 bg-neutral-900">
              <h2 className="text-white text-sm font-semibold">Playing trailer</h2>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={closeModal}
                className="rounded px-3 py-1 text-sm bg-white/10 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Close trailer"
              >
                ✕
              </button>
            </div>
            <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
              <iframe
                title="YouTube trailer"
                src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

