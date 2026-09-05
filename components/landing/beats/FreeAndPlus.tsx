import { COPY } from "@/lib/landing-content";
import { Surface } from "@/components/Surface";

export function FreeAndPlus() {
  const c = COPY.freeAndPlus;
  return (
    <section id={c.slug} aria-labelledby={`${c.slug}-h`} className="beat">
      <h2 id={`${c.slug}-h`} className="rise" style={{ fontSize: "clamp(30px, 4.6vw, 48px)", marginBottom: 24 }}>
        {c.title}
      </h2>
      <div className="stagger" style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <Surface register="lift" className="p-6">
          <p className="eyebrow">Free</p>
          <p className="mt-2 text-lg">{c.free}</p>
        </Surface>
        <Surface register="lift" className="p-6">
          <p className="eyebrow">Plus</p>
          <p className="mt-2 text-lg">{c.plus}</p>
          <p className="mt-2 text-[var(--text-secondary)]">{c.note}</p>
        </Surface>
      </div>
    </section>
  );
}
