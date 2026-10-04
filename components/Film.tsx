import { FilmPlayer } from './FilmPlayer';
import { FILM_TRANSCRIPT_ID } from '@/lib/film';
import { COPY_13 } from '@/lib/copy-13';

// The film section: the first thing to ride up over the pinned hero. The
// player is the one client island (FilmPlayer); the heading, the tier line
// and the transcript are server markup. The transcript is the film's text
// alternative: every spoken line, who says it, and what the picture shows,
// under a heading per chapter so a screen reader can jump between them.
export function Film() {
  const { film } = COPY_13;
  return (
    <section className="film" id="film" aria-labelledby="film-title">
      <div className="film-inner">
        <div className="film-head">
          <div>
            <p className="eyebrow reveal" aria-hidden="true">{film.eyebrow}</p>
            <h2 id="film-title" className="h-display reveal">
              <span className="sr-only">{film.eyebrow}: </span>
              {film.title[0]}
              <br />
              <span className="muted">{film.title[1]}</span>
            </h2>
          </div>
          <p className="film-lede reveal">{film.lede}</p>
        </div>

        <div className="film-stage">
          <FilmPlayer />
        </div>

        <div className="film-foot">
          <p className="film-whisper">{film.whisper}</p>
          <details className="film-transcript" id={FILM_TRANSCRIPT_ID}>
            {/* The homepage's ghost pill (.btn-ghost); summary is not in the
                global focus-visible list, so the ring is set in the CSS. */}
            <summary className="btn btn-ghost film-summary">
              <span>{film.transcriptSummary}</span>
              <svg className="film-chevron" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </summary>
            <div className="film-transcript-body">
              {film.transcript.map((chapter) => (
                // A div, not a section: six more landmarks would crowd the
                // page's landmark list. The h3 is how a reader moves between them.
                <div key={chapter.heading}>
                  <h3>{chapter.heading}</h3>
                  {chapter.lines.map((line) => (
                    <p className={line.who === 'On screen' || line.who === 'Sound' ? 'film-line film-line-scene' : 'film-line'} key={line.text}>
                      <span className="film-who">{line.who}:</span> {line.text}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
