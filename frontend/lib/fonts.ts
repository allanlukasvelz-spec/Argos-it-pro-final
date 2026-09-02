import { Cormorant_Garamond, Inter } from "next/font/google";

/**
 * FASE 21.4 — Corporate fonts via next/font (self-hosted at build time).
 * CSS variables are attached on <html>; body stays on system stack until
 * a subtree opts in via `.argos-corporate` (Portal/Auth isolation).
 */

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"]
});

export const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cormorant",
  weight: ["500", "600", "700"]
});

export const corporateFontVariables = `${inter.variable} ${cormorantGaramond.variable}`;
