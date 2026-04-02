"use client";
import { ReactNode, useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      // During build/prerender, the env var may not exist.
      // Return null so we can skip the provider.
      return null;
    }
    return new ConvexReactClient(url);
  }, []);

  if (!convex) {
    // Render children without Convex during static prerender
    return <>{children}</>;
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
