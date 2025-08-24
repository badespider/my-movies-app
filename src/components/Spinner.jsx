/**
 * Spinner component
 * Simple centered SVG loader.
 */
export default function Spinner() {
  return (
    <div role="status" aria-live="polite" className="inline-flex items-center">
      <svg
        className="size-5 animate-spin text-neutral-400"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6V2z"
        />
      </svg>
      <span className="sr-only">Loading</span>
    </div>
  )
}

