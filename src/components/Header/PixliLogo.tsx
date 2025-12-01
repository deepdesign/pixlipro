/**
 * PixliLogo Component
 * 
 * SVG logo component for the Pixli application header and footer
 * Uses the pixli-logo-white.svg from public/logo/SVG/
 * The logo color follows the theme's primary accent color via CSS mask
 */
export const PixliLogo = ({ className = "" }: { className?: string }) => (
  <div
    className={className}
    style={{
      maskImage: "url('/logo/SVG/pixli-logo-p-white.svg')",
      WebkitMaskImage: "url('/logo/SVG/pixli-logo-p-white.svg')",
      maskSize: "contain",
      WebkitMaskSize: "contain",
      maskRepeat: "no-repeat",
      WebkitMaskRepeat: "no-repeat",
      maskPosition: "center",
      WebkitMaskPosition: "center",
      backgroundColor: "var(--accent-primary)",
      display: "block",
    }}
    aria-hidden="true"
    role="img"
    aria-label="Pixli: generative art toy"
  />
);


