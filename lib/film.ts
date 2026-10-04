/* The homepage film's files and the names its pieces share. A plain module,
   not the client player's: the server-rendered section (components/Film.tsx)
   reads these too, and a constant exported from a "use client" file reaches
   server code as a client reference, not a string. */

export const FILM_SOURCES = [
  { src: "/film/fathom-film-1080.mp4", media: "(min-width: 768px)" },
  { src: "/film/fathom-film-720.mp4" },
] as const;
export const FILM_POSTER = "/film/fathom-film-poster.jpg";
/** On by default: the narration, the music and the chimes, which the picture doesn't caption. */
export const FILM_CAPTIONS = "/film/fathom-film.en.vtt";
/** Every line, for caption styles the picture's own captions can't take. */
export const FILM_CAPTIONS_FULL = "/film/fathom-film.en-full.vtt";
export const FILM_TRANSCRIPT_ID = "film-transcript";

/**
 * The hero's "Watch the film" asks for the film with this event, inside its
 * click, so the play() it leads to counts as the reader's own gesture. The
 * player sets `handled` when it takes the request; if it hasn't mounted yet,
 * the link falls back to its plain #film jump.
 */
export const FILM_REQUEST = "fathom:film-request";
export type FilmRequest = CustomEvent<{ handled: boolean }>;
