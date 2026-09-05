import { COPY } from "@/lib/landing-content";
import { Phone } from "../Phone";
import { LookoutScreen } from "../screens/LookoutScreen";
import { BeatLayout } from "./BeatLayout";

export function WalkIn() {
  const c = COPY.walkIn;
  return (
    <BeatLayout
      slug={c.slug}
      eyebrow={c.eyebrow}
      title={c.title}
      tier={c.tier}
      spoken={c.captions}
      phone={
        <Phone activeTab="Home" label="Fathom in Lookout, narrating a lobby as it changes">
          <LookoutScreen captions={c.captions} />
        </Phone>
      }
    >
      <p>{c.body}</p>
    </BeatLayout>
  );
}
