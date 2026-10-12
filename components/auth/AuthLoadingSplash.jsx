'use client';

export function AuthLoadingSplash({ label = 'Checking courtside session...' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-deep-green text-off-white select-none"
    >
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        {/* PikolScore Icon Badge */}
        <div className="relative">
          <svg
            width="56"
            height="56"
            viewBox="0 0 40 40"
            aria-hidden="true"
            className="drop-shadow-lg transition-transform hover:scale-105"
          >
            <rect width="40" height="40" rx="12" fill="#0F5C62" />
            <circle cx="20" cy="20" r="10" fill="#FEECD6" />
            <circle cx="16.5" cy="16.5" r="1.6" fill="#084B46" />
            <circle cx="23.5" cy="19" r="1.6" fill="#084B46" />
            <circle cx="19" cy="24" r="1.6" fill="#084B46" />
          </svg>
          {/* Subtle glowing ring behind icon */}
          <div
            className="absolute -inset-1 rounded-2xl bg-cream/20 blur-md animate-pulse pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* Brand Name */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-[0.08em] text-off-white">
            PIKOLSCORE
          </h1>
          <p className="text-xs font-medium tracking-[0.2em] text-line uppercase mt-1">
            Courtside Precision
          </p>
        </div>

        {/* Minimal Courtside Loading Indicator */}
        <div className="mt-4 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-cream animate-ping" />
          <span className="text-xs tracking-wider text-line font-normal">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

export default AuthLoadingSplash;
