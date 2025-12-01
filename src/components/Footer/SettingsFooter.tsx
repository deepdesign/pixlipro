/**
 * Settings Footer Component
 * Reusable footer for settings pages with logo on left and text on right
 */
export function SettingsFooter() {
  return (
    <footer className="flex items-center justify-between w-full text-[0.7rem] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
      {/* Logo on left */}
      <div className="flex-shrink-0">
        <img 
          src="/logo/SVG/pixli-logo-white.svg" 
          alt="Pixli: generative art toy"
          className="h-8 w-auto"
        />
      </div>

      {/* Text on right */}
      <div className="text-right">
        <span>
          © {new Date().getFullYear()} Pixli · generative art toy · v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'} ·{" "}
          <a href="https://jamescutts.me/" target="_blank" rel="noreferrer" className="text-[var(--accent-primary)] hover:opacity-80">
            jamescutts.me
          </a>
        </span>
      </div>
    </footer>
  );
}

