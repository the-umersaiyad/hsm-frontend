import type { Metadata } from "next";

import { Providers } from "@/components/Providers";
import "./globals.css";



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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100..700;1,100..700&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`antialiased font-sans`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
