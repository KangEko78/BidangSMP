"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function MagneticCursor() {
  const cursor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const node = cursor.current;
    if (!node) return;
    const x = gsap.quickTo(node, "x", { duration: 0.34, ease: "power3.out" });
    const y = gsap.quickTo(node, "y", { duration: 0.34, ease: "power3.out" });
    const move = (event: MouseEvent) => { x(event.clientX); y(event.clientY); };
    const onEnter = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.closest("button,a,[data-magnetic]")) node.classList.add("cursor-active");
    };
    const onLeave = () => node.classList.remove("cursor-active");
    window.addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mouseover", onEnter);
    document.addEventListener("mouseout", onLeave);
    return () => { window.removeEventListener("mousemove", move); document.removeEventListener("mouseover", onEnter); document.removeEventListener("mouseout", onLeave); };
  }, []);

  return <div ref={cursor} className="magnetic-cursor" aria-hidden="true"><span /></div>;
}
