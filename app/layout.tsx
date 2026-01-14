import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { DebugOverlay } from "@/components/DebugOverlay";
import { ThemeEffects } from "@/components/ThemeEffects";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["100", "400", "700", "800"],
});

export const metadata: Metadata = {
  title: "MATHPREP_AI // PCSTYLE",
  description: "Generuj rozbudowane plany nauki matematyki z pomocą AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={`${jetbrainsMono.variable} antialiased`}>
        <ConvexClientProvider>
          <ThemeProvider>
            <ThemeEffects />
            <div className="relative z-10">{children}</div>
            <DebugOverlay />
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}

