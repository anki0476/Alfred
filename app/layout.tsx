import {SmoothScroll} from "../components/SmoothScroll";
import {GlobalMusic} from "../components/GlobalMusic";
import type { Metadata } from "next";
import "./globals.css";
import "./theme.css";
import {ThemeInit} from "../components/Appearance";
import CursorEffects from "../components/CursorEffects";
import { InteractionSounds } from "../components/InteractionSounds";

export const metadata: Metadata = {
  title: "Alfred — Teach it. Understand it.",
  description: "A focused study studio for explaining, checking and refining your reasoning.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><ThemeInit /><SmoothScroll /><InteractionSounds /><CursorEffects />{children}<GlobalMusic /></body>
    </html>
  );
}


