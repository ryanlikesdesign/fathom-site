import { ActiveFooter } from "./ActiveFooter";

export function LookoutScreen({ captions }: { captions: readonly string[] }) {
  return (
    <>
      <p className="scr-title">Lookout</p>
      <p className="scr-sub">Continuous awareness</p>
      <div className="stagger" style={{ display: "grid", gap: 8 }}>
        {captions.map((c) => (
          <p key={c} className="scr-caption">
            {c}
          </p>
        ))}
      </div>
      <ActiveFooter />
    </>
  );
}
