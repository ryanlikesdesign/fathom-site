import { EXAMPLES } from "@/lib/app-facts";
import { Glyph } from "./Glyph";

/** The iOS status bar: phone chrome, not the app. The clock is an example. */
export function StatusBar() {
  return (
    <div className="ph-status">
      <span className="ph-status-time">{EXAMPLES.clock}</span>
      <span className="ph-status-island" />
      <span className="ph-status-right">
        <Glyph name="ios-bars" className="ph-status-bars" />
        <Glyph name="ios-wifi" className="ph-status-wifi" />
        <Glyph name="ios-battery" className="ph-status-battery" />
      </span>
    </div>
  );
}
