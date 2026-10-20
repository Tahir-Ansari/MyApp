"use client";

import { useSyncExternalStore } from "react";

export type Platform = "ios" | "other";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  // iPadOS reports itself as Mac; touch support tells them apart.
  const isIos = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  return isIos ? "ios" : "other";
}

const noopSubscribe = () => () => {};

/** "ios" needs manual Add to Home Screen steps; null during server render and hydration. */
export function usePlatform(): Platform | null {
  return useSyncExternalStore<Platform | null>(noopSubscribe, detectPlatform, () => null);
}
