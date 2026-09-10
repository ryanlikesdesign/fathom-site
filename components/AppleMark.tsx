/** The Apple logo, for the download buttons. Decorative: the button text carries the name. */
export function AppleMark({ className = "apple-mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 17 20" aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M13.9 10.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.8-.8-3-.8C4.4 5.4 3 6.3 2.2 7.7c-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.8 3-.8s1.8.8 3 .7c1.3 0 2-1.1 2.8-2.3.9-1.3 1.2-2.6 1.3-2.6-.1 0-2.5-.9-2.5-3.7zM11.6 3.8c.6-.8 1.1-1.9.9-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.8-1.3z" />
    </svg>
  );
}
