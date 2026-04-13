import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { PlayerProvider } from "@/context/PlayerContext";

export const metadata: Metadata = {
  title: "SecureScope - DNS & Website Threat Analyzer",
  description: "Compare two websites for DNS security, TLS posture, and header-based threat exposure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white antialiased">
        <PlayerProvider>
          <div className="min-h-screen">
            <Sidebar />
            <Header />
            <main className="ml-64 pt-16 pb-24">
              {children}
            </main>
          </div>
        </PlayerProvider>
      </body>
    </html>
  );
}
