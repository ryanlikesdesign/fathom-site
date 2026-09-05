import { COPY } from "@/lib/landing-content";
import { Phone } from "../Phone";
import { LiveTaskScreen } from "../screens/LiveTaskScreen";
import { BeatLayout } from "./BeatLayout";

export function DoIt() {
  const c = COPY.doIt;
  return (
    <BeatLayout
      slug={c.slug}
      eyebrow={c.eyebrow}
      title={c.title}
      tier={c.tier}
      spoken={c.steps}
      spokenLabel="The steps"
      phone={
        <Phone activeTab="Home" label="Fathom in Live Task, with three steps and a push-to-talk ring">
          <LiveTaskScreen steps={c.steps} done={2} />
        </Phone>
      }
    >
      <p>{c.body}</p>
    </BeatLayout>
  );
}
