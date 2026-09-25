"use client";

import type { PostHog } from "posthog-js";
import { POSTHOG_HOST, POSTHOG_KEY } from "@/lib/promo";

/**
 * posthog-js is the largest script on the site and nothing on the first
 * paint needs it, so it is not in any page's initial bundle: the provider
 * pulls it in once the browser is idle, and the promo surfaces pull it in on
 * mount. One memoized promise means every caller shares a single download
 * and a single init, whichever asks first.
 *
 * Resolves null when the chunk cannot be fetched (offline, blocked); the
 * memo clears so the next caller tries again. Analytics never throws into
 * the page.
 */
let ready: Promise<PostHog | null> | null = null;

export function ensurePostHogReady(): Promise<PostHog | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!ready) {
    ready = import("posthog-js")
      .then(({ default: posthog }) => {
        if (!posthog.__loaded) {
          posthog.init(POSTHOG_KEY, {
            api_host: POSTHOG_HOST,
            person_profiles: "identified_only",
            capture_pageview: false, // manual via PageViewTracker
            capture_pageleave: true,
            // The privacy page says the site does not record your screen. The
            // project setting already has recording off; this keeps it off if
            // that setting ever changes.
            disable_session_recording: true,
          });
        }
        return posthog;
      })
      .catch((err: unknown) => {
        console.error("[posthog] failed to load:", err);
        ready = null;
        return null;
      });
  }
  return ready;
}
