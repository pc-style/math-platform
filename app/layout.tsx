import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeEffects } from "@/components/ThemeEffects";
import { TutorProvider } from "@/context/TutorContext";
import { TutorSidebar } from "@/components/TutorSidebar";
import { UserSync } from "@/components/UserSync";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["100", "400", "700", "800"],
});

export const metadata: Metadata = {
  title: "MATHPREP_AI // PCSTYLE",
  description: "Generuj rozbudowane plany nauki matematyki z pomocą AI.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MathPrep",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: "#000000",
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
          <UserSync />
          <ThemeProvider>
            <TutorProvider>
              <ThemeEffects />
              <div className="relative z-10">{children}</div>
              <TutorSidebar />
            </TutorProvider>
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}

