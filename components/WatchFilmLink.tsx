'use client';

import type { MouseEvent, ReactNode } from 'react';
import { FILM_REQUEST, type FilmRequest } from '@/lib/film';

// The hero's "Watch the film": a real link to #film, so a no-JS load, a
// middle click and "open in new tab" all still jump there. A plain click
// asks the film player (FilmPlayer) to scroll into view and start playing
// when it arrives; the request is sent inside the click, so the playback it
// leads to is the reader's own gesture. If the player hasn't hydrated yet,
// nothing takes the request and the link jumps as usual.
export function WatchFilmLink({ className, children }: { className?: string; children: ReactNode }) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const request: FilmRequest = new CustomEvent(FILM_REQUEST, { detail: { handled: false } });
    window.dispatchEvent(request);
    if (request.detail.handled) e.preventDefault();
  };
  return (
    <a href="#film" className={className} onClick={onClick}>
      <svg className="play-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M8.5 5.6v12.8a.9.9 0 0 0 1.38.76l10-6.4a.9.9 0 0 0 0-1.52l-10-6.4a.9.9 0 0 0-1.38.76z" fill="currentColor" />
      </svg>
      {children}
    </a>
  );
}
