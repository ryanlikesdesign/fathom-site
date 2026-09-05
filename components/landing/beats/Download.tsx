import { COPY } from "@/lib/landing-content";
import { APP_STORE_URL } from "@/lib/promo";

export function Download() {
  const c = COPY.download;
  return (
    <section id={c.slug} aria-labelledby={`${c.slug}-h`} className="beat" style={{ textAlign: "center" }}>
      <h2 id={`${c.slug}-h`} className="rise" style={{ fontSize: "clamp(30px, 4.6vw, 48px)" }}>
        {c.title}
      </h2>
      <div className="download-card rise">
        <a href={APP_STORE_URL} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
          {c.button}
        </a>
        <p className="download-note">{c.meta}</p>
      </div>
    </section>
  );
}
