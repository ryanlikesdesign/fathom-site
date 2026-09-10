'use client';

import type { ReactNode } from 'react';
import { useWide } from '@/lib/useWide';

// The desktop scrolly's one sticky device. Its eleven screens arrive as
// children from the server component, so the mockups stay server markup;
// this island only decides whether that stack exists at all. Once the
// viewport is known to be narrow it leaves the DOM (each step carries its
// own MobilePhone instead), so a phone never keeps a second, display:none
// copy of every screen.
// The one deliberate exception: on the server render and the hydration
// pass (`wide === null`) BOTH sets are in the document, and the CSS
// breakpoint (.scrolly-sticky is display:none under 861px) shows one. That
// is what a no-JS visitor keeps, and it is the price of the mockups
// existing at all without JavaScript; before this the no-JS page had no
// device but the hero's. A JS visitor unmounts the loser one render later.
export function StickyPhone({ children }: { children: ReactNode }) {
  const wide = useWide();
  if (wide === false) return null;
  return (
    <div className="scrolly-sticky">
      <div className="phone" aria-hidden="true">
        <div className="phone-screen">
          {children}
        </div>
        <div className="phone-reflect" aria-hidden="true" />
      </div>
    </div>
  );
}
