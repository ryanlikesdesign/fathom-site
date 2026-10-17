import { Fragment, type CSSProperties } from "react";
import "@/components/why/why.css";
import "@/components/why/art.css";
import { Button } from "@/components/Button";
import { Section } from "@/components/Section";
import { Mark } from "@/components/brand/Mark";
import { WhyReelArt, WhySceneStill } from "@/components/why/morph/MorphStage";
import { pocketView } from "@/components/why/morph";
import { WhyDirector, WhyGateScript } from "@/components/why/WhyDirector";
import { pageMeta } from "@/lib/pageMeta";

export const metadata = pageMeta(
  "Why I built fathom",
  "Assistive technology has always arrived second. The phone in your pocket can change that now, and keep pace from here. Ryan Higgins on why he built fathom.",
  "/why",
);

const APP_STORE = "https://apps.apple.com/us/app/fathom-visual-assistance/id6760924183";

// Ryan's own history, in order. The order is the argument.
const TIMELINE = [
  { era: "As a kid", text: "A video magnifier that put my textbooks, worksheets and mail on a TV screen, huge. Too big to leave the room." },
  { era: "Then", text: "A portable version, portable in name only. It was heavy." },
  { era: "Early ’90s", text: "ZoomText, software that enlarges everything on screen, on a DOS laptop." },
  { era: "Later", text: "Magnifiers and screen readers on Windows. Each step helped. Each one was hard to learn." },
  { era: "The smartphone", text: "A screen reader and magnifier built into every phone, out of the box. A real leap." },
];

// Consumer feature → the assistive job the same hardware can do.
const PAIRS = [
  { built: "Sharpening a selfie", pointed: "Reading a menu" },
  { built: "Brightening a night photo", pointed: "Finding a curb" },
  { built: "Previewing a couch in your living room", pointed: "Mapping a hallway" },
  { built: "Captioning your photos", pointed: "Describing a street" },
];

const PIVOT = ["That’s", "why", "I", "built", "fathom."];

// The pivot's band's view on a phone (morph/index.ts POCKET_VIEWS): the stage composes the mark's box
// and the line under it from the view's shape (why.css --why-pivot-mark-h).
const [, , PIVOT_VW, PIVOT_VH] = pocketView("r1", "climax");
const PIVOT_VIEW = { "--vw": PIVOT_VW, "--vh": PIVOT_VH } as CSSProperties;

/*
 * One essay, one reel of art (components/why/). On wide screens a sticky
 * pane beside the text column carries a single pool of pieces from the
 * hero to the summit: they reform between sections, become the fathom
 * mark before the pivot, and come back out of it after. Three blocks pin
 * there while the art plays against them: the hero's abilities, the five
 * machines, and the four pairs while the viewfinder re-targets level with
 * each one. Every other sentence is plain flow and never moves.
 * data-why-at marks the sentences the art keys to.
 *
 * On a phone each WhySceneStill is a pocket: a band of the same art. Each
 * band after the hero's rises in as the drawing the band before it ended
 * on and reforms it into its own on the way up, then pins under the header
 * between two blocks of text while the rest of its pieces reform, and
 * scrolls away. A .why-frame-pin pins its band together with the text it
 * steps through (the hero's sentences, the machines, the pairs) when they
 * fit on one screen, and otherwise steps in flow as each item comes up; the
 * hands' band always steps in flow, the glasses forming as their paragraph
 * comes up, and the summit's band opens on those glasses. The
 * ceiling's and the people's bands open their sections, above the
 * headline, so the headline keeps its text. On the static page (reduced motion, Pause
 * motion, more contrast, forced colors, text zoom, no script) each
 * placement is that section's finished drawing, and the pivot shows the
 * exact mark. Everything visual is aria-hidden: the words carry the meaning.
 */
export default function WhyPage() {
  return (
    <article className="why" aria-labelledby="why-h">
      <WhyGateScript />
      <div className="why-reel" data-why-reel="r1">
        <Section className="why-hero">
          <div className="why-hero-pin">
            <div className="why-copy">
              <h1 id="why-h">Why I built fathom</h1>
              <div className="why-frame-pin why-hero-frame-pin" data-why-frame="hero">
                <div className="why-frame why-hero-frame">
                  <WhySceneStill scene="hero" />
                  <div className="why-lede">
                    <p className="why-claim" data-why-at="hero-dark">The phone in your pocket can see in the dark.</p>
                    <div className="why-abilities">
                      <p data-why-at="hero-sign">It can read a street sign from half a block away.</p>
                      <p data-why-at="hero-room">It can map a room in 3D while you walk through it.</p>
                      <p data-why-at="hero-ai">It can run AI on the phone itself, with no internet connection.</p>
                    </div>
                    <p className="why-turn" data-why-at="hero-scroll">Most people use it to scroll.</p>
                  </div>
                </div>
                <div className="why-frame-run" aria-hidden="true" />
              </div>
              <p className="why-byline">
                <span className="why-byline-name">Ryan Higgins,</span> founder of fathom
              </p>
            </div>
          </div>
          <div className="why-hero-run" data-why-at="hero-run" aria-hidden="true" />
        </Section>

        <Section labelledBy="why-second" className="why-scene is-tone">
          <div className="why-copy">
            <h2 id="why-second" className="why-h2" data-why-at="arrives-h2">Accessibility always arrives second.</h2>
            <div className="why-body">
              <p data-why-at="arrives-p1">
                It has always worked this way. Cameras got good for selfies years before anyone pointed
                one at a menu for a blind reader. Every leap in consumer hardware reaches us late, and
                only partway.
              </p>
              <p data-why-at="arrives-p2">I’ve watched this my whole life. I’m visually impaired.</p>
              <div className="why-frame-pin" data-why-frame="arrives">
                <div className="why-frame">
                  <WhySceneStill scene="arrives" />
                  <ol className="why-timeline" aria-label="My assistive technology, in order" data-why-at="timeline">
                    {TIMELINE.map((t, i) => (
                      <li key={t.era} data-why-at={`era-${i + 1}`}>
                        <span className="why-era">{t.era}</span> {t.text}
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="why-frame-run" aria-hidden="true" />
              </div>
              <p className="why-beat" data-why-at="beat-stop">Then it stopped.</p>
            </div>
          </div>
        </Section>

        <Section labelledBy="why-ceiling" className="why-scene">
          <div className="why-copy">
            <WhySceneStill scene="ceiling" />
            <h2 id="why-ceiling" className="why-h2" data-why-at="ceil-h2">Good enough became the ceiling.</h2>
            <div className="why-body">
              <p data-why-at="ceil-p">
                Blind and low vision people still get a watered-down version of the apps everyone else
                uses. Even apps built for accessibility run on older technology and settle for good
                enough.
              </p>
            </div>
          </div>
        </Section>

        <Section labelledBy="why-pace" className="why-scene is-tone why-pace">
          <div className="why-copy">
            <h2 id="why-pace" className="why-h2" data-why-at="pace-h2">Catch up now. Keep pace from here.</h2>
            <div className="why-body">
              <p data-why-at="pace-p1">
                Accessibility doesn’t have to wait its turn anymore. The tech built to entertain
                everyone else is already in your pocket, and it can do far more.
              </p>
              <div className="why-frame-pin" data-why-frame="pace">
                <div className="why-frame">
                  <WhySceneStill scene="pace" />
                  <div className="why-pairs-block" data-why-at="pace-pairs">
                    <p className="why-legend" aria-hidden="true">
                      <span>Built for</span>
                      <span>Pointed at</span>
                    </p>
                    <ul className="why-pairs" aria-label="The same technology, two jobs">
                      {PAIRS.map((p, i) => (
                        <li key={p.built} className="why-pair" data-why-at={`pair-${i + 1}`}>
                          <dl>
                            <dt className="sr-only">Built for</dt>
                            <dd className="why-built">{p.built}</dd>
                            <dt className="sr-only">Pointed at</dt>
                            <dd className="why-pointed">{p.pointed}</dd>
                          </dl>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="why-frame-run" aria-hidden="true" />
              </div>
              <p className="why-statement" data-why-at="pace-p2">
                <span className="why-phrase">Point that tech at the right problems</span>{" "}
                <span className="why-phrase">and accessibility catches up fast.</span>
              </p>
              <p className="why-keep" data-why-at="pace-p3">
                Then it has to keep up. AI gets better every few months. Accessibility tools should too,{" "}
                <span className="why-keep-clause">
                  <span className="why-phrase">at the same speed,</span>{" "}
                  <span className="why-phrase">not a decade behind.</span>
                </span>
              </p>
            </div>
          </div>
        </Section>

        <div className="why-pivot-stage" data-why-at="pivot-stage" style={PIVOT_VIEW}>
          <WhySceneStill scene="climax" />
          <Section className="why-pivot why-scene is-accent">
            <div className="why-iris" aria-hidden="true" />
            <div className="why-copy">
              <div className="why-pivot-mark" aria-hidden="true">
                <Mark size={240} />
              </div>
              <p className="why-pivot-line" data-why-at="pivot">
                <span className="sr-only">That’s why I built fathom.</span>
                <span className="why-words" aria-hidden="true">
                  {PIVOT.map((w, i) => (
                    <Fragment key={i}>
                      <span data-why-word={i} style={{ "--i": i } as CSSProperties}>
                        {w}
                      </span>{" "}
                    </Fragment>
                  ))}
                </span>
              </p>
            </div>
          </Section>
        </div>

        <Section labelledBy="why-people" className="why-scene">
          <div className="why-copy">
            <WhySceneStill scene="people" />
            <h2 id="why-people" className="why-h2" data-why-at="people-h2">Built with the people who use it.</h2>
            <div className="why-body">
              <p data-why-at="people-p1">fathom started as an experiment. Now blind people shape it.</p>
              <p data-why-at="people-p2">
                It was tested in Delaware and Minneapolis, with friends from the National Federation of
                the Blind. Feedback now comes in through the app from across the US and Europe. People
                tell us what breaks, and that decides what we build next.
              </p>
              <p data-why-at="people-p3">
                The goal: a visual assistant, built for blind people, in the hands of every blind
                person.
              </p>
            </div>
          </div>
        </Section>

        <Section labelledBy="why-hands" className="why-scene is-tone why-hands">
          <div className="why-copy">
            <h2 id="why-hands" className="why-h2" data-why-at="hands-h2">Your hands are already full.</h2>
            <div className="why-frame-pin" data-why-frame="hands">
              <div className="why-frame">
                <WhySceneStill scene="hands" />
                <div className="why-body">
                  <p data-why-at="hands-p1">A white cane in one hand. A guide dog’s harness in the other. Nobody needs another device to hold.</p>
                  <p data-why-at="hands-p2">
                    fathom’s future is hands-free: a camera you wear, like a pair of glasses, that keeps
                    what it sees private and doesn’t draw attention.
                  </p>
                  <p data-why-at="hands-p3">
                    We’re testing it now on smart glasses from XREAL and devices running Google’s Android
                    XR, and bringing fathom to Android phones. fathom won’t lock you into one device.
                    You pick the glasses that fit your life, and fathom gets better as the hardware does.
                  </p>
                </div>
              </div>
              <div className="why-frame-run" aria-hidden="true" />
            </div>
            <div className="why-body">
              <WhySceneStill scene="summit" />
              <p className="why-beat" data-why-at="hands-summit">That’s the next summit.</p>
              <div className="why-close">
                <Button href={APP_STORE} external rel="noopener noreferrer" variant="primary" size="xl">
                  Download fathom<span className="sr-only"> on the App Store</span>
                </Button>
                <Button href="/feedback" variant="secondary" size="xl">
                  Tell us what to build
                </Button>
              </div>
            </div>
          </div>
        </Section>

        <div className="why-pane" aria-hidden="true">
          <div className="why-pane-col">
            <WhyReelArt reel="r1" />
          </div>
        </div>
      </div>

      <WhyDirector />
    </article>
  );
}
