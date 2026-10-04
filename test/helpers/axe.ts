import { configureAxe } from "jest-axe";

/**
 * axe for pages with a <video>. jest-axe's axe-core waits, before it runs,
 * for every video with a source to fire loadedmetadata, and jsdom never
 * loads media, so the run would hang until the test times out. Skipping
 * that preload loses nothing here: the only rule it serves is
 * no-autoplay-audio, and test/film.test.tsx asserts the film never
 * autoplays directly.
 */
export const axe = configureAxe({ preload: false });
