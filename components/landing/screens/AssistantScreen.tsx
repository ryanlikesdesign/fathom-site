/** AssistantView.swift:441, 483 — the two chips are "Activities" and "Ask Fathom". */
export function AssistantScreen({ goal, plan }: { goal: string; plan: readonly string[] }) {
  return (
    <>
      <p className="scr-title">Assistant</p>
      <p className="scr-caption">&ldquo;{goal}&rdquo;</p>
      <div className="scr-steps unfold">
        {plan.map((p, i) => (
          <div key={p} className="scr-step">
            <span className="scr-check">{i + 1}</span>
            {p}
          </div>
        ))}
      </div>
      <div className="scr-footer" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <span className="scr-end">Activities</span>
        <span className="scr-primary">Ask Fathom</span>
      </div>
    </>
  );
}
