import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "./helpers/axe";
import { Film } from "@/components/Film";
import { FathomLanding } from "@/components/FathomLanding";
import { COPY_13 as COPY } from "@/lib/copy-13";
import {
  FILM_CAPTIONS,
  FILM_CAPTIONS_FULL,
  FILM_POSTER,
  FILM_REQUEST,
  FILM_SOURCES,
  FILM_TRANSCRIPT_ID,
  type FilmRequest,
} from "@/lib/film";
import { marketingViolations, stringsIn, words } from "./helpers/copy-rules";

const { film } = COPY;
const PUBLIC = join(__dirname, "..", "public");
const PLAY_NAME = new RegExp(`^${film.play}`);

/** Each cue's text with the lines joined. */
function vttCues(file: string): string[] {
  return readFileSync(join(PUBLIC, file), "utf8")
    .split(/\n\s*\n/)
    .filter((block) => block.includes("-->"))
    .map((block) => {
      const lines = block.split("\n");
      const at = lines.findIndex((l) => l.includes("-->"));
      return lines.slice(at + 1).join("\n").trim();
    });
}

/** The spoken words of a track: sound lines dropped, speaker labels stripped. */
function spokenIn(cues: string[]): string {
  return words(
    cues
      .flatMap((cue) => cue.split("\n"))
      .filter((line) => !line.startsWith("["))
      .map((line) => line.replace(/^(Narrator|You|fathom): /, ""))
      .join(" "),
  );
}

const linesBy = (...who: string[]) =>
  film.transcript.flatMap((c) => c.lines.filter((l) => who.includes(l.who)).map((l) => l.text));

// jsdom has no media playback: play() resolves, load() and pause() do
// nothing, and nothing scrolls.
let playSpy: ReturnType<typeof vi.spyOn>;
let loadSpy: ReturnType<typeof vi.spyOn>;
let scrollSpy: ReturnType<typeof vi.fn<(arg?: boolean | ScrollIntoViewOptions) => void>>;
beforeEach(() => {
  playSpy = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
  loadSpy = vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  scrollSpy = vi.fn<(arg?: boolean | ScrollIntoViewOptions) => void>();
  Element.prototype.scrollIntoView = scrollSpy;
});
afterEach(() => vi.restoreAllMocks());

const clickPlay = () => act(async () => fireEvent.click(screen.getByRole("button", { name: PLAY_NAME })));

describe("the film", () => {
  it("sits first under the hero, and the hero's second button goes to it with a play glyph", () => {
    const { container } = render(<FathomLanding />);
    expect(container.querySelector(".hero-cover")?.firstElementChild?.id).toBe("film");
    const link = screen.getByRole("link", { name: COPY.hero.ctas.secondary });
    expect(link.getAttribute("href")).toBe("#film");
    expect(link.querySelector("svg.play-mark")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("has no axe violations in any state", async () => {
    const { container } = render(<Film />);
    expect(await axe(container)).toHaveNoViolations();
    await clickPlay();
    expect(await axe(container)).toHaveNoViolations();
    await act(async () => fireEvent.ended(container.querySelector("video")!));
    expect(await axe(container)).toHaveNoViolations();
    const sources = container.querySelectorAll("source");
    await act(async () => fireEvent.error(sources[sources.length - 1]));
    expect(await axe(container)).toHaveNoViolations();
    (container.querySelector(`#${FILM_TRANSCRIPT_ID}`) as HTMLDetailsElement).open = true;
    expect(await axe(container)).toHaveNoViolations();
  });

  it("is a heading, a lede and a tier line", () => {
    render(<Film />);
    const section = screen.getByRole("region", { name: /Four questions/ });
    const h2 = within(section).getByRole("heading", { level: 2 });
    expect(h2.textContent).toBe(`${film.eyebrow}: ${film.title[0]}${film.title[1]}`);
    expect(section.querySelector(".film-lede")?.textContent).toBe(film.lede);
    expect(section.querySelector(".film-whisper")?.textContent).toBe(film.whisper);
  });

  it("offers one play button that says how long it is, over a video that never starts itself", () => {
    const { container } = render(<Film />);
    const play = screen.getByRole("button", { name: `${film.play}, ${film.durationSr}, ${film.features}` });
    // Label in Name: the visible label starts the accessible name.
    expect(play.textContent?.startsWith(film.play)).toBe(true);
    const video = container.querySelector("video")!;
    expect(video.autoplay).toBe(false);
    expect(video.getAttribute("preload")).toBe("none");
    expect(video.hasAttribute("playsinline")).toBe(true);
    expect(video.getAttribute("poster")).toBe(FILM_POSTER);
    // Covered by the button: hidden from assistive tech, no native controls.
    expect(video.getAttribute("aria-hidden")).toBe("true");
    expect(video.controls).toBe(false);
    expect(Array.from(video.querySelectorAll("source")).map((s) => s.getAttribute("src"))).toEqual(FILM_SOURCES.map((s) => s.src));
    const tracks = Array.from(video.querySelectorAll("track"));
    expect(tracks.map((t) => [t.getAttribute("kind"), t.getAttribute("src"), t.getAttribute("label"), t.hasAttribute("default")])).toEqual([
      ["captions", FILM_CAPTIONS, film.captionsNarration, true],
      ["captions", FILM_CAPTIONS_FULL, film.captionsFull, false],
    ]);
  });

  it("hands over to the native controls on play, and back to the poster and Watch again at the end", async () => {
    const { container } = render(<Film />);
    const video = container.querySelector("video")!;
    await clickPlay();
    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(video.controls).toBe(true);
    expect(video.hasAttribute("aria-hidden")).toBe(false);
    expect(document.activeElement).toBe(video);
    expect(screen.queryByRole("button", { name: PLAY_NAME })).toBeNull();

    await act(async () => fireEvent.ended(video));
    const again = screen.getByRole("button", { name: new RegExp(`^${film.replay}`) });
    expect(document.activeElement).toBe(again);
    expect(video.controls).toBe(false);
    // Back to the poster, not the end card under the button.
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it("leaves focus where it is when the film ends while the reader is in the transcript", async () => {
    const { container } = render(<Film />);
    const video = container.querySelector("video")!;
    await clickPlay();
    const summary = container.querySelector<HTMLElement>(`#${FILM_TRANSCRIPT_ID} summary`)!;
    summary.focus();
    await act(async () => fireEvent.ended(video));
    expect(document.activeElement).toBe(summary);
  });

  it("says so when the film can't load, and offers to try again or read the transcript", async () => {
    playSpy.mockImplementationOnce(() => Promise.reject(new DOMException("no source", "NotSupportedError")));
    const { container } = render(<Film />);
    await clickPlay();
    expect(screen.getByRole("status").textContent).toBe(film.error);
    // Focus was on the video it had just moved to; it goes to the way forward.
    const retry = screen.getByRole("button", { name: film.retry });
    expect(document.activeElement).toBe(retry);
    expect(container.querySelector("video")!.getAttribute("aria-hidden")).toBe("true");

    await act(async () => fireEvent.click(screen.getByRole("button", { name: film.transcriptSummary })));
    const details = container.querySelector<HTMLDetailsElement>(`#${FILM_TRANSCRIPT_ID}`)!;
    expect(details.open).toBe(true);
    expect(document.activeElement).toBe(details.querySelector("summary"));

    await act(async () => fireEvent.click(retry));
    expect(loadSpy).toHaveBeenCalled();
    expect(playSpy).toHaveBeenCalledTimes(2);
    expect(container.querySelector("video")!.controls).toBe(true);
  });

  it("stays on the poster when the browser skips a source made for wider windows", async () => {
    // A <source> whose media query doesn't match fires error on every load:
    // on a phone, the 1080p file's. React hands it to the video's onError too.
    const { container } = render(<Film />);
    const [wide] = container.querySelectorAll("source");
    expect(wide.getAttribute("media")).toBe(FILM_SOURCES[0].media);
    await act(async () => fireEvent.error(wide));
    expect(screen.getByRole("button", { name: PLAY_NAME })).toBeInTheDocument();
    expect(screen.getByRole("status").textContent).toBe("");

    // Playing, and after "Watch again" reloads the sources, it keeps playing.
    await clickPlay();
    await act(async () => fireEvent.error(wide));
    expect(container.querySelector("video")!.controls).toBe(true);
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("goes back to the play button when the browser wants a tap on the player itself", async () => {
    playSpy.mockImplementationOnce(() => Promise.reject(new DOMException("gesture", "NotAllowedError")));
    render(<Film />);
    await clickPlay();
    expect(screen.getByRole("button", { name: PLAY_NAME })).toBeInTheDocument();
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("scrolls to the film and starts it when the hero's Watch the film asks", async () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<FathomLanding />);
      const video = container.querySelector("video")!;
      const link = screen.getByRole("link", { name: COPY.hero.ctas.secondary });
      const notPrevented = fireEvent.click(link);
      // The player took it: no jump, a scroll, and a play inside the click
      // (the unlock) that never counts as a viewing.
      expect(notPrevented).toBe(false);
      expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ block: "center" }));
      expect(playSpy).toHaveBeenCalledTimes(1);
      expect(video.controls).toBe(false);
      // jsdom has no IntersectionObserver or scrollend: the arrival check starts it.
      await act(async () => vi.advanceTimersByTime(3000));
      expect(playSpy).toHaveBeenCalledTimes(2);
      expect(video.controls).toBe(true);
      expect(document.activeElement).toBe(video);
    } finally {
      vi.useRealTimers();
    }
  });

  it("lets the link jump to #film when no player has taken the request", () => {
    const request: FilmRequest = new CustomEvent(FILM_REQUEST, { detail: { handled: false } });
    window.dispatchEvent(request);
    expect(request.detail.handled).toBe(false);
  });

  it("has a transcript with a heading per chapter and every line attributed", () => {
    const { container } = render(<Film />);
    const details = container.querySelector(`details#${FILM_TRANSCRIPT_ID}`)!;
    expect(details.querySelector("summary")?.textContent).toBe(film.transcriptSummary);
    expect(Array.from(details.querySelectorAll("h3")).map((h) => h.textContent)).toEqual(film.transcript.map((c) => c.heading));
    const lines = Array.from(details.querySelectorAll(".film-line")).map((p) => p.textContent);
    expect(lines).toEqual(film.transcript.flatMap((c) => c.lines.map((l) => `${l.who}: ${l.text}`)));
  });

  it("follows the copy rules", () => {
    expect(marketingViolations(stringsIn(film).join("\n"))).toEqual([]);
  });

  it("captions the narration by default, and nothing the picture already shows", () => {
    const cues = vttCues(FILM_CAPTIONS);
    expect(spokenIn(cues)).toBe(words(linesBy("Narrator").join(" ")));
    for (const line of linesBy("You", "fathom")) expect(words(cues.join(" "))).not.toContain(words(line));
    // The chimes are captioned at every question.
    expect(cues.filter((c) => c === "[Listening chime]")).toHaveLength(4);
    expect(cues.filter((c) => c === "[Heard chime]")).toHaveLength(4);
  });

  it("has every spoken line, in order, in the every-line track", () => {
    expect(spokenIn(vttCues(FILM_CAPTIONS_FULL))).toBe(words(linesBy("Narrator", "You", "fathom").join(" ")));
  });

  it("ships its files, each small enough for a phone", () => {
    for (const { src } of FILM_SOURCES) expect(statSync(join(PUBLIC, src)).size).toBeLessThan(15_000_000);
    expect(statSync(join(PUBLIC, FILM_POSTER)).size).toBeLessThan(200_000);
  });
});
