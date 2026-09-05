import { ActiveFooter } from "./ActiveFooter";

/**
 * Pointing inside Lookout: the hand, then the answer in the app's three
 * beats — the thing, the words on it, the rest.
 */
export function PointScreen({ beats }: { beats: readonly [string, string, string] }) {
  return (
    <>
      <p className="scr-title">Lookout</p>
      <div className="hand">
        <span className="hand-palm" />
        <span className="hand-finger point-extend" />
        <span className="hand-target" />
      </div>
      <div className="beats-in" style={{ display: "grid", gap: 8 }}>
        {beats.map((b) => (
          <p key={b} className="scr-caption">
            {b}
          </p>
        ))}
      </div>
      <ActiveFooter />
    </>
  );
}
