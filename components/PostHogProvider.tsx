'use client';

import type { PostHog } from 'posthog-js';
import { lazy, Suspense, useEffect, useState } from 'react';
import { ensurePostHogReady } from '@/lib/posthog';

// The page-view tracker and posthog-js/react's provider live in their own
// chunk (PostHogTracking.tsx) so nothing PostHog ships in the initial bundle.
const Tracking = lazy(() => import('./PostHogTracking'));

// Idle-time analytics. The page renders and hydrates with no PostHog at all;
// once the browser reports idle (or 3s pass, or 1.5s where requestIdleCallback
// does not exist, which is Safari) the library loads, initializes and starts
// tracking. The children are rendered plain from the first paint and are never
// re-parented: the provider mounts beside them, not around them, because
// swapping a wrapper in above the whole app would unmount and remount every
// page below it. Nothing on the site reads PostHog through context; the promo
// surfaces call the singleton directly.
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<PostHog>();

  useEffect(() => {
    let canceled = false;
    const load = () => {
      void ensurePostHogReady().then((ph) => {
        if (ph && !canceled) setClient(ph);
      });
    };
    let cancel: () => void;
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(load, { timeout: 3000 });
      cancel = () => window.cancelIdleCallback(id);
    } else {
      const id = window.setTimeout(load, 1500);
      cancel = () => window.clearTimeout(id);
    }
    return () => {
      canceled = true;
      cancel();
    };
  }, []);

  return (
    <>
      {client && (
        <Suspense fallback={null}>
          <Tracking client={client} />
        </Suspense>
      )}
      {children}
    </>
  );
}
