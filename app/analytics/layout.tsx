import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics | AgentX",
  description: "View upload success and failure analytics across all channels",
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
