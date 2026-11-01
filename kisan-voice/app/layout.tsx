import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kisan Voice — खेती की बात, अपनी भाषा में",
  description:
    "A voice-first multilingual agricultural information assistant for Indian farmers, powered by Sarvam AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
