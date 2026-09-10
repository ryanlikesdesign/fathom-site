'use client';

import type { ReactNode } from 'react';
import { useWide } from '@/lib/useWide';

// The inline phone above each step's copy on phones and tablets. The mirror
// of StickyPhone: once the viewport is known to be wide it leaves the DOM,
// so desktop never keeps eleven hidden devices behind the sticky one. On
// the server render and the hydration pass (`wide === null`) it is present
// alongside the sticky set and .step-phone{display:none} hides it above
// 860px; see StickyPhone for why that no-JS duplicate is accepted.
export function MobilePhone({ children }: { children: ReactNode }) {
  const wide = useWide();
  if (wide === true) return null;
  return (
    <div className="step-phone reveal" aria-hidden="true">
      <div className="phone">
        <div className="phone-screen">
          {children}
        </div>
        <div className="phone-reflect" />
      </div>
    </div>
  );
}
