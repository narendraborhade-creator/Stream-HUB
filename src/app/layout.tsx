import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { PlayerProvider } from "@/context/PlayerContext";

export const metadata: Metadata = {
  title: "RevDevelop | DNS Security Comparator",
  description: "Compare websites for DNS security posture and web hardening signals.",
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
