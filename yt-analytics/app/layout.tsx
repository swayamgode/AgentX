import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aura Analytics | YouTube Dashboard",
  description: "Advanced glassmorphism dashboard for YouTube Analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <div className="app-layout">
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
