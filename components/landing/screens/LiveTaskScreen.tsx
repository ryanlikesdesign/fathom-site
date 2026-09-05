import { LIVE_TASK_BADGE } from "@/lib/landing-content";
import { ActiveFooter } from "./ActiveFooter";

export function LiveTaskScreen({ steps, done }: { steps: readonly string[]; done: number }) {
  return (
    <>
      <p className="scr-title">
        Live Task <span className="scr-chip">{LIVE_TASK_BADGE}</span>
      </p>
      <p className="scr-sub">Step-by-step guidance</p>
      <div className="scr-steps ticks">
        {steps.map((s, i) => (
          <div key={s} className={`scr-step${i < done ? " is-done" : ""}`}>
            <span className="scr-check">{i < done ? "✓" : ""}</span>
            {s}
          </div>
        ))}
      </div>
      <div className="ptt ptt-pulse">🎙</div>
      <ActiveFooter />
    </>
  );
}
