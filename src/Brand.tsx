/** An open key / a space to enter. This mark is independent of a person's name. */
export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`brand-mark ${className}`.trim()}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="brand-mark__half brand-mark__half--left"
        data-brand-stroke
        d="M26 8H20C13.373 8 8 13.373 8 20V44C8 50.627 13.373 56 20 56H26"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        className="brand-mark__half brand-mark__half--right"
        data-brand-stroke
        d="M38 56H44C50.627 56 56 50.627 56 44V20C56 13.373 50.627 8 44 8H38"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle className="brand-mark__point" cx="32" cy="32" r="4" fill="currentColor" />
    </svg>
  );
}
