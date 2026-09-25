import { Mark } from "@/components/brand/Mark";
import { Glyph } from "./Glyph";
import { TouchIndicator } from "./TouchIndicator";

export type Connection = "cloud" | "device" | "offline";

export interface AppHeaderProps {
  /**
   * The transcript toggle's state in a still. In a scene, set the
   * `transcript` channel ("closed" | "open") instead.
   */
  transcript?: "closed" | "open";
  /** Where the thinking happens: cloud.fill (Cloud AI), cloud (On device), wifi.slash (offline). */
  connection?: Connection;
  /** Continuous narration: speaker.wave.2.fill when on, speaker.slash.fill when off. */
  narration?: boolean;
  /** The month's Cloud AI use, 0 to 1, drawn on the ring. Never shown as a number. */
  usage?: number;
  /** Beats in which a finger taps the transcript toggle. */
  transcriptTouch?: string;
  /** Beats in which a finger taps the menu. */
  menuTouch?: string;
}

const CONNECTION = { cloud: "cloud-fill", device: "cloud", offline: "wifi-slash" } as const;

/**
 * The conversation screen's header (AssistantConnectionStatusView and
 * AssistantBrandMarkButton): the transcript toggle, then the connection
 * glyph, the usage ring around the 24 mark and the narration glyph on the
 * axis, then the menu mark. A 1fr auto 1fr grid on the gutter.
 */
export function AppHeader({
  transcript = "closed",
  connection = "cloud",
  narration = false,
  usage = 0.18,
  transcriptTouch,
  menuTouch,
}: AppHeaderProps) {
  const progress = Math.round(Math.min(1, Math.max(0, usage)) * 100);
  return (
    <div className="ph-header">
      <span className="ph-hdr-cell ph-hdr-start">
        <span className="ph-hdr-toggle" data-open={transcript === "open" ? "" : undefined}>
          <Glyph name="text-bubble" className="ph-hdr-toggle-closed" />
          <Glyph name="text-bubble-fill" className="ph-hdr-toggle-open" />
          {transcriptTouch ? <TouchIndicator show={transcriptTouch} /> : null}
        </span>
      </span>
      <span className="ph-hdr-center">
        <span className="ph-hdr-cell" data-connection={connection}>
          <Glyph name={CONNECTION[connection]} className="ph-hdr-connection" />
        </span>
        <span className="ph-usage">
          <svg className="ph-usage-ring" viewBox="0 0 42 42" aria-hidden="true" focusable="false">
            <circle className="ph-usage-track" cx="21" cy="21" r="16.2" />
            {progress > 0 ? (
              <circle className="ph-usage-progress" cx="21" cy="21" r="16.2" pathLength={100} strokeDasharray={`${progress} 100`} />
            ) : null}
          </svg>
          <Mark size={24} className="ph-usage-mark" />
        </span>
        <span className="ph-hdr-cell" data-narration={narration ? "on" : "off"}>
          <Glyph name={narration ? "speaker-wave-fill" : "speaker-slash-fill"} className="ph-hdr-narration" />
        </span>
      </span>
      <span className="ph-hdr-cell ph-hdr-end">
        <Glyph name="menu" className="ph-hdr-menu" />
        {menuTouch ? <TouchIndicator show={menuTouch} /> : null}
      </span>
    </div>
  );
}
