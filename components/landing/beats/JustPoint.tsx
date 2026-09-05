import { COPY, SNAPSHOT_OPTIONS } from "@/lib/landing-content";
import { Phone } from "../Phone";
import { PointScreen } from "../screens/PointScreen";
import { BeatLayout } from "./BeatLayout";

export function JustPoint() {
  const c = COPY.justPoint;
  return (
    <BeatLayout
      slug={c.slug}
      eyebrow={c.eyebrow}
      title={c.title}
      tier={c.tier}
      spoken={c.beats}
      spokenLabel="The answer, in three parts"
      phone={
        <Phone activeTab="Home" label="A hand pointing at a vending machine; Fathom answers in three parts">
          <PointScreen beats={c.beats} />
        </Phone>
      }
    >
      <p>{c.body}</p>
      <p>{c.where}</p>
      <h3 className="mt-6 text-base font-medium">{c.snapshotIntro}</h3>
      <ul className="opts stagger" aria-label="Snapshot options">
        {SNAPSHOT_OPTIONS.map((o) => (
          <li key={o}>{o}</li>
        ))}
      </ul>
    </BeatLayout>
  );
}
