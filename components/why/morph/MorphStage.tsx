/* ================================================================
   The formation engine's server components.

   <MorphStage reel> is a reel's pane art (the desktop stage): ONE svg on
   the 600 x 800 grid, ONE persistent <path> per piece of the pool, drawn
   at the reel's opening formation, then the clip window and the brand
   mark layer. The director (WhyDirector.tsx) rewrites each path's d and
   style as the reader scrolls; the pane stays hidden until its first
   write. The svg fills the pane's column (preserveAspectRatio meet), so
   the grid is as large as the column's height allows, centered, with the
   column's spare width as bleed (the column clips: art never reaches the
   text).

   <MorphPocket> is one placement: on the static page, the formation that
   ends there, finished, cropped by its viewBox; on a phone with motion, a
   pocket (why.css): the same svg in a band that pins under the header
   while the director plays the formations into this one (the svg's
   viewBox becomes the pocket's own view of the phone grid, data-view, and
   the band takes its shape from --vw and --vh). It draws every piece of the
   pool, so the pocket can move any of them, and marks each one's role
   and fill for forced colors (the static page's only). A pocket with
   nothing to play (data-run "none") has no runway: it never pins; one no
   pocket ends (data-why-static) is the static page's only.

   <WhyReelArt> and <WhySceneStill> are what page.tsx places.

   Everything is aria-hidden and unfocusable: the essay says what it shows.
   ================================================================ */

import type { CSSProperties } from "react";
import { KEYED, MORPHS, morphStill, POCKET_ALIGN, pocketPlan, pocketView, stillKey } from "./index";
import type { CompiledMorph, MorphReelId, ResolvedFormation } from "./formation";
import { MARK_VAR, styleVars } from "./render";
import { asNow, VIEW_H, VIEW_W } from "./pieces";
import { MARK_PATH } from "./brand";

/** The clip window's id: one per svg in the document. */
export const windowId = (reel: string, scope: string) => `why-win-${reel}-${scope}`;
/** The pivot's navy, and the ground around it, as clips of the mark layer: one pair per svg. */
export const navyId = (reel: string, scope: string) => `why-navy-${reel}-${scope}`;
export const groundId = (reel: string, scope: string) => `why-ground-${reel}-${scope}`;
/** The pieces' layer, drawn again on the navy (a <use> of it, in the on-accent colors). */
export const layerId = (reel: string, scope: string) => `why-layer-${reel}-${scope}`;

/** Everywhere: the ground clip with no navy in it. */
export const GROUND_ALL = "M-9999 -9999H9999V9999H-9999Z";

/**
 * The pieces at one formation, as one layer, then the brand mark. Clipped
 * pieces draw together inside the window, where the first of them sits in
 * the pool. `marks` puts each piece's role and fill on it for forced
 * colors.
 *
 * The mark is drawn twice, from the same exact path: in its ink on the
 * page's ground, and in its on-accent color where the pivot's navy is
 * behind it (the director writes both clips as the iris opens), so the
 * color boundary travels with the iris edge and the mark is never
 * repainted outside the design system's own mark colors. The pieces are
 * drawn twice the same way (a <use> of their layer inside the navy's
 * clip, in the on-accent roles), so they can come back out of the mark
 * while the navy is still leaving.
 */
function Art({ c, f, scope, marks }: { c: CompiledMorph; f: ResolvedFormation; scope: string; marks?: boolean }) {
  const path = (i: number) => {
    const p = c.pool[i];
    const st = f.states[i];
    return (
      <path
        key={p.id}
        data-piece={p.id}
        data-role={marks ? st.look.role : undefined}
        data-fill={marks ? st.look.fill : undefined}
        d={f.frame.pieces[i].d}
        style={styleVars(asNow(st).look) as unknown as CSSProperties}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    );
  };
  const clipId = windowId(c.reel, scope);
  const firstClipped = c.pool.findIndex((p) => p.clip);
  const out = [];
  for (let i = 0; i < c.pool.length; i++) {
    if (c.pool[i].clip) {
      if (i !== firstClipped) continue;
      out.push(
        <g key="why-window" clipPath={`url(#${clipId})`}>
          {c.pool.map((p, j) => (p.clip ? path(j) : null))}
        </g>,
      );
    } else out.push(path(i));
  }
  const mark = f.mark;
  const markO = Math.min(1, Math.max(0, mark.o));
  return (
    <>
      <defs>
        {c.clipped ? (
          <clipPath id={clipId}>
            <path data-why-window="" d={f.frame.window} />
          </clipPath>
        ) : null}
        {c.marked ? (
          <>
            <clipPath id={navyId(c.reel, scope)}>
              <path data-why-navy="" d="" />
            </clipPath>
            <clipPath id={groundId(c.reel, scope)}>
              <path data-why-ground="" clipRule="evenodd" d={GROUND_ALL} />
            </clipPath>
          </>
        ) : null}
      </defs>
      {c.marked ? (
        <>
          <g clipPath={`url(#${groundId(c.reel, scope)})`}>
            <g id={layerId(c.reel, scope)} data-why-layer="" style={{ opacity: f.frame.layer } as CSSProperties}>
              {out}
            </g>
          </g>
          <g className="why-on-navy" clipPath={`url(#${navyId(c.reel, scope)})`}>
            <use data-why-use="" href={`#${layerId(c.reel, scope)}`} />
          </g>
        </>
      ) : (
        <g data-why-layer="" style={{ opacity: f.frame.layer } as CSSProperties}>
          {out}
        </g>
      )}
      {c.marked ? (
        <>
          <g clipPath={`url(#${groundId(c.reel, scope)})`}>
            <g
              data-why-mark=""
              className="why-morph-mark"
              transform={f.frame.mark.transform}
              style={{ "--m-f": MARK_VAR[mark.role], opacity: markO } as CSSProperties}
            >
              <path d={MARK_PATH.d} fillRule={MARK_PATH.fillRule} />
            </g>
          </g>
          <g clipPath={`url(#${navyId(c.reel, scope)})`}>
            <g
              data-why-mark-on=""
              className="why-morph-mark"
              transform={f.frame.mark.transform}
              style={{ "--m-f": MARK_VAR.onAccent, opacity: markO } as CSSProperties}
            >
              <path d={MARK_PATH.d} fillRule={MARK_PATH.fillRule} />
            </g>
          </g>
        </>
      ) : null}
    </>
  );
}

export function MorphStage({ c }: { c: CompiledMorph }) {
  const f = c.formations[0];
  return (
    <svg
      className="why-morph"
      data-why-morph={c.reel}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      {f ? <Art c={c} f={f} scope="pane" /> : null}
    </svg>
  );
}

/** A placement: the finished formation on the static page, a pocket on a phone with motion. */
export function MorphPocket({ c, f, keyName }: { c: CompiledMorph; f: ResolvedFormation; keyName: string }) {
  const [cx, cy, cw, ch] = f.crop;
  const [vx, vy, vw, vh] = pocketView(c.reel, keyName);
  const plan = pocketPlan(c.reel, keyName);
  const playing = !!plan && plan.steps.length > 1;
  const runway = playing && typeof plan.run === "number" ? plan.run : null;
  const vars = {
    "--cx": cx,
    "--cy": cy,
    "--cw": cw,
    "--ch": ch,
    "--vw": vw,
    "--vh": vh,
    ...(runway !== null ? { "--why-run": `${runway}svh` } : {}),
  } as CSSProperties;
  return (
    <div
      className="why-still is-morph why-pocket"
      data-why-pocket={keyName}
      data-reel={c.reel}
      data-formation={f.id}
      data-run={!playing ? "none" : keyName in KEYED ? "keyed" : runway !== null ? "steps" : plan.run}
      data-why-static={plan ? undefined : ""}
      aria-hidden="true"
      style={vars}
    >
      <div className="why-pocket-band">
        <svg
          className="why-morph"
          viewBox={`${cx} ${cy} ${cw} ${ch}`}
          data-view={`${vx} ${vy} ${vw} ${vh}`}
          preserveAspectRatio={POCKET_ALIGN[keyName] ?? "xMidYMid meet"}
          aria-hidden="true"
          focusable="false"
        >
          <Art c={c} f={f} scope={keyName} marks />
        </svg>
      </div>
    </div>
  );
}

/** The pane's art: the essay's formations. */
export function WhyReelArt({ reel }: { reel: MorphReelId }) {
  const c = MORPHS[reel];
  return c ? <MorphStage c={c} /> : null;
}

/** A placement: the formation that draws it, finished on the static page, a pocket on a phone. */
export function WhySceneStill({ scene, pair }: { scene: string; pair?: number }) {
  const m = morphStill(scene, pair);
  if (!m) return null;
  return <MorphPocket c={m.c} f={m.f} keyName={stillKey(scene, pair)} />;
}
