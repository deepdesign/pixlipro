/**
 * Settings Footer Component
 * Reusable footer for settings pages with logo on left and text on right
 */
export function SettingsFooter() {
  return (
    <footer className="flex items-center justify-between w-full text-[0.65rem] uppercase tracking-[0.18em] text-theme-muted">
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
                © {new Date().getFullYear()} Pixli · generative art toy · v0.3.3 Beta ·{" "}
          <a 
            href="https://www.jamescutts.me/" 
            target="_blank" 
            rel="noreferrer" 
            className="!text-[var(--accent-primary)] hover:!text-[var(--accent-primary)]/80 transition-colors"
            style={{ color: 'var(--accent-primary)' }}
          >
            jamescutts.me
          </a>
        </span>
      </div>
    </footer>
  );
}

