import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kisan Voice",
  description: "Your farm. Your language. Your voice. A voice-first agricultural assistant powered by Sarvam AI.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#2f6b3a" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
