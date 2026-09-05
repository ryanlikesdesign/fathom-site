import { ACTIVE_MODE_CONTROLS } from "@/lib/landing-content";

/**
 * What every active mode has at the bottom, and nothing else: the primary
 * Ask Fathom, the Snapshot icon, one End tile, and More actions. These are
 * spans, not buttons — the whole phone is a role="img", and a focusable
 * control inside a picture would be a keyboard trap.
 */
export function ActiveFooter() {
  return (
    <div className="scr-footer">
      <span className="scr-primary">{ACTIVE_MODE_CONTROLS.primary}</span>
      <span className="scr-icon" title="Snapshot">
        ◎
      </span>
      <span className="scr-end">{ACTIVE_MODE_CONTROLS.end}</span>
      <span className="scr-icon" title={ACTIVE_MODE_CONTROLS.menu} style={{ gridColumn: "1 / -1", justifySelf: "end", width: 36 }}>
        ⋯
      </span>
    </div>
  );
}
