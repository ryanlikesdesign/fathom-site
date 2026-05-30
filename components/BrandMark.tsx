// Fathom brand mark — concentric "sonar" rings. Decorative; pair with a
// text label (or aria-label on the link) for the accessible name.
export function BrandMark({ className = "brand-mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="7" className="ring-center" />
      <circle cx="60" cy="60" r="18" className="ring ring-1" />
      <circle cx="60" cy="60" r="30" className="ring ring-2" />
      <circle cx="60" cy="60" r="42" className="ring ring-3" />
    </svg>
  );
}
