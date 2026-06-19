import type { Metadata } from "next";
// trigger reload
import { Providers } from "@/components/Providers";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HomeFixCare",
  description: "Home Service Management Platform",
  manifest: "/manifest.json",
  icons: {
    icon: "/homefixcareicon-removebg-preview-removebg-preview.ico",
    shortcut: "/homefixcareicon.jpeg",
    apple: "/homefixcareicon.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased ${inter.className}`}
      >
        <svg width="0" height="0" className="absolute" style={{ width: 0, height: 0, position: 'absolute' }}>
          <defs>
            <linearGradient id="primary-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00b8a9" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#f96c7a" />
            </linearGradient>
            <linearGradient id="primary-icon-gradient-dark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ef5c6" />
              <stop offset="50%" stopColor="#b965fb" />
              <stop offset="100%" stopColor="#f9b856" />
            </linearGradient>
          </defs>
        </svg>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
