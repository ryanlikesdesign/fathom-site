import { COPY } from "@/lib/landing-content";

export function UnderTheHood() {
  const c = COPY.underTheHood;
  return (
    <section id={c.slug} aria-labelledby={`${c.slug}-h`} className="beat">
      <h2 id={`${c.slug}-h`} className="rise" style={{ fontSize: "clamp(30px, 4.6vw, 48px)", marginBottom: 24 }}>
        {c.title}
      </h2>
      <dl className="hood stagger">
        {c.items.map((item) => (
          <div key={item.term}>
            <dt>{item.term}</dt>
            <dd>{item.detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
