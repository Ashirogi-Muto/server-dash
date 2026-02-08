import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Use Inter for UI elements
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Use JetBrains Mono for code/terminal elements if available, otherwise generic monospace
const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Server Dashboard",
  description: "Self-hosted server management",
  icons: {
    icon: "/favicon.ico",
  },
};

import { SettingsProvider } from "@/providers/SettingsProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${mono.variable} font-sans antialiased bg-zinc-950 text-zinc-50`}
      >
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}
