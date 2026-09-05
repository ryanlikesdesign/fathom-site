import { COPY } from "@/lib/landing-content";
import { Phone } from "../Phone";
import { GoScreen } from "../screens/GoScreen";
import { BeatLayout } from "./BeatLayout";

export function FindIt() {
  const c = COPY.findIt;
  return (
    <BeatLayout
      slug={c.slug}
      eyebrow={c.eyebrow}
      title={c.title}
      tier={c.tier}
      spoken={c.captions}
      phone={
        <Phone activeTab="Home" label="Fathom in Go, pointing a clock-face dial at the counter">
          <GoScreen destination="the counter" bearing={2} metres={8} caption={c.captions[1]} />
        </Phone>
      }
    >
      <p>{c.body}</p>
    </BeatLayout>
  );
}
