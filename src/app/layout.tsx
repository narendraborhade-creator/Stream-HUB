import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NetShield 3D | DNS Security Comparator',
  description: 'Compare DNS security and website threat signals with interactive visual analytics.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white antialiased">
        <main>{children}</main>
      </body>
    </html>
  );
}
