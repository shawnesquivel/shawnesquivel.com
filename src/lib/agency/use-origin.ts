"use client";

import { useSyncExternalStore } from "react";
import { SITE } from "@/lib/agency/site";

const subscribeNoop = () => () => {};

export function useOrigin(): string {
  return useSyncExternalStore(
    subscribeNoop,
    () => window.location.origin,
    () => SITE.url,
  );
}
