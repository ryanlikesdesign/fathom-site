import { ActiveFooter } from "./ActiveFooter";

/** `bearing` is a clock-face hour (1–12); the hand points there. */
export function GoScreen({
  destination,
  bearing,
  metres,
  caption,
}: {
  destination: string;
  bearing: number;
  metres: number;
  caption: string;
}) {
  const degrees = (bearing % 12) * 30;
  return (
    <>
      <p className="scr-title">Go</p>
      <p className="scr-sub">To {destination}</p>
      <div className="dial">
        <i className="dial-turn" style={{ transform: `rotate(${degrees}deg)` }} />
        <b />
      </div>
      <p className="dial-label">
        {bearing} o&apos;clock · about {metres} metres
      </p>
      <p className="scr-caption">{caption}</p>
      <ActiveFooter />
    </>
  );
}
