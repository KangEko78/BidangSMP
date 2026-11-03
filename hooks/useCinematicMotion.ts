"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";
import type { ServiceView } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function useCinematicMotion(root: RefObject<HTMLElement | null>, view: ServiceView) {
  useGSAP(() => {
    const intro = gsap.utils.toArray<HTMLElement>("[data-reveal]");
    gsap.fromTo(intro, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85, stagger: 0.08, ease: "power3.out", clearProps: "transform" });

    // The home hero carries the scroll narrative; content stays in normal document flow.
    if (view === "beranda") {
      const title = root.current?.querySelector(".story-title");
      const depth = root.current?.querySelectorAll<HTMLElement>("[data-depth]");
      if (title) gsap.to(title, { scale: 0.82, opacity: 0.2, y: -24, ease: "none", scrollTrigger: { trigger: ".story-hero", start: "top top", end: "bottom top", scrub: 0.7 } });
      depth?.forEach((layer) => gsap.to(layer, { z: -130 * Number(layer.dataset.depth || 1), y: 54 * Number(layer.dataset.depth || 1), ease: "none", scrollTrigger: { trigger: ".story-hero", start: "top top", end: "bottom top", scrub: 0.8 } }));
    }

    gsap.utils.toArray<HTMLElement>("[data-card]").forEach((card) => {
      gsap.fromTo(card, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 92%", once: true } });
    });
  }, { scope: root, dependencies: [view], revertOnUpdate: true });
}
