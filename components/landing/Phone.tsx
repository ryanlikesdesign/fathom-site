import type { ReactNode } from "react";
import { TAB_BAR } from "@/lib/landing-content";

/**
 * The device frame every mockup sits in: status bar, screen, and the app's
 * real four-item tab bar. It knows nothing about modes.
 *
 * The whole frame is one `role="img"` named by `label`, so VoiceOver gets a
 * single sentence per phone instead of a pile of decorative fragments. Any
 * text that matters (the spoken captions) is rendered again by the beat as a
 * visually-hidden list outside this frame, where it reads in order.
 */
export function Phone({
  activeTab,
  label,
  children,
}: {
  activeTab: (typeof TAB_BAR)[number];
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="ph" role="img" aria-label={label}>
      <div className="ph-screen">
        <div className="ph-status">
          <span className="ph-time">9:41</span>
          <span className="ph-island" />
          <span className="ph-signal" />
        </div>
        <div className="ph-body">{children}</div>
        <div className="ph-tabs">
          {TAB_BAR.map((tab) => (
            <span key={tab} className={tab === activeTab ? "ph-tab is-active" : "ph-tab"}>
              <span className="ph-tab-dot" />
              {tab}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
