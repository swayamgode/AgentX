"use client";
import { ReactNode, useMemo } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    // During build, the URL might be missing. We provide a placeholder to 
    // allow child hooks like useAuthActions to resolve their context provider.
    const url = process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder-url.convex.cloud";
    return new ConvexReactClient(url);
  }, []);

  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}

