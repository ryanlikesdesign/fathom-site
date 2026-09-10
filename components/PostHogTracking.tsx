'use client';

import type { PostHog } from 'posthog-js';
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

// Loaded lazily by PostHogProvider once posthog-js is ready. posthog-js/react
// imports posthog-js itself, so this file has to be its own chunk or the
// provider would drag the whole library back into the initial bundle.

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (pathname && ph) {
      let url = window.origin + pathname;
      const search = searchParams?.toString();
      if (search) url += '?' + search;
      ph.capture('$pageview', { $current_url: url });
    }
  }, [pathname, searchParams, ph]);

  return null;
}

export default function PostHogTracking({ client }: { client: PostHog }) {
  return (
    <PHProvider client={client}>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </PHProvider>
  );
}
