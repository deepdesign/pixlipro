import { PixliLogo } from "@/components/Header/PixliLogo";
import { useIsMobile } from "@/hooks/useIsMobile";

interface FooterProps {
  className?: string;
  minimal?: boolean;
}

export function Footer({ className = "", minimal = false }: FooterProps) {
  const isMobile = useIsMobile();

  if (minimal) {
    return (
      <footer className={`text-[0.7rem] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 ${className}`}>
        <span>
          © {new Date().getFullYear()} Pixli · generative art toy · v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'} ·{" "}
          <a href="https://jamescutts.me/" target="_blank" rel="noreferrer" className="text-[var(--accent-primary)] hover:opacity-80">
            jamescutts.me
          </a>
        </span>
      </footer>
    );
  }

  return (
    <footer className={`app-footer${isMobile ? " app-footer--mobile" : ""} ${className}`}>
      <div className="footer-brand">
        {!isMobile && <PixliLogo className="footer-logo" />}
      </div>
      <span className="footer-text">
        © {new Date().getFullYear()} Pixli · generative art toy · v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'} ·{" "}
        <a href="https://jamescutts.me/" target="_blank" rel="noreferrer">
          jamescutts.me
        </a>
      </span>
    </footer>
  );
}

