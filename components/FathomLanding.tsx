"use client";

import { useEffect, useRef } from "react";
import "./fathom-landing.css";
import "./landing/landing.css";
import { Hero } from "./landing/beats/Hero";
import { WalkIn } from "./landing/beats/WalkIn";
import { FindIt } from "./landing/beats/FindIt";
import { DoIt } from "./landing/beats/DoIt";
import { PlanIt } from "./landing/beats/PlanIt";
import { JustPoint } from "./landing/beats/JustPoint";
import { UnderTheHood } from "./landing/beats/UnderTheHood";
import { FreeAndPlus } from "./landing/beats/FreeAndPlus";
import { Download } from "./landing/beats/Download";

/**
 * The homepage is a story told in beats — walk in, find it, do it, plan it,
 * just point — each one a section with its own heading, so a screen-reader
 * user gets the whole thing by heading with no motion at all. Motion is CSS
 * scroll timelines inside each beat; the only JavaScript left here is the
 * reading-progress rail.
 */
export function FathomLanding() {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onScroll() {
      const h = document.documentElement;
      const scrolled = h.scrollTop || document.body.scrollTop;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? Math.max(0, Math.min(1, scrolled / max)) : 0;
      if (progressRef.current) progressRef.current.style.width = `${(pct * 100).toFixed(2)}%`;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fathom-root">
      <div className="progress-rail" aria-hidden="true">
        <div className="progress-fill" ref={progressRef} />
      </div>

      <Hero />
      <WalkIn />
      <FindIt />
      <DoIt />
      <PlanIt />
      <JustPoint />
      <UnderTheHood />
      <FreeAndPlus />
      <Download />
    </div>
  );
}
