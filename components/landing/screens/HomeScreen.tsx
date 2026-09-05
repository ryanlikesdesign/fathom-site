import { MODES } from "@/lib/landing-content";

/**
 * Home, simplified: the mode tiles with their real subtitles. Snapshot is a
 * split control whose chevron opens the Snapshot options, as in the app.
 * Assistant is a tab, not a tile, so it isn't here.
 */
export function HomeScreen() {
  const tiles = MODES.filter((m) => m.name !== "Assistant");
  return (
    <>
      <p className="scr-title">Fathom</p>
      <div className="scr-grid">
        {tiles.map((m) =>
          m.name === "Snapshot" ? (
            <div key={m.name} className="scr-split" style={{ gridColumn: "1 / -1" }}>
              <div className="scr-tile">
                <b>{m.name}</b>
                <span>{m.subtitle}</span>
              </div>
              <div className="scr-chev" title="Snapshot options">
                ⌄
              </div>
            </div>
          ) : (
            <div key={m.name} className={`scr-tile${m.tier === "plus" ? " is-plus" : ""}`}>
              <b>{m.name}</b>
              <span>{m.subtitle}</span>
            </div>
          ),
        )}
      </div>
    </>
  );
}
