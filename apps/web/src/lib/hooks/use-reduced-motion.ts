"use client";

import { useEffect, useState } from "react";

/**
 * Reports whether the user has requested reduced motion.
 * Framer Motion already reads this internally; we only need it for
 * hand-rolled transitions where we choose animation vs. instant swap.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduce;
}
