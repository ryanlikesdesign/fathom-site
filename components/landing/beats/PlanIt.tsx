import { COPY } from "@/lib/landing-content";
import { Phone } from "../Phone";
import { AssistantScreen } from "../screens/AssistantScreen";
import { BeatLayout } from "./BeatLayout";

export function PlanIt() {
  const c = COPY.planIt;
  return (
    <BeatLayout
      slug={c.slug}
      eyebrow={c.eyebrow}
      title={c.title}
      tier={c.tier}
      spoken={[c.goal, ...c.plan]}
      spokenLabel="The goal, then the plan"
      phone={
        <Phone activeTab="Assistant" label="Fathom's Assistant turning a goal into a three-step plan">
          <AssistantScreen goal={c.goal} plan={c.plan} />
        </Phone>
      }
    >
      <p>{c.body}</p>
    </BeatLayout>
  );
}
