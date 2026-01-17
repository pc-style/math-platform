import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeEffects } from "@/components/ThemeEffects";
import { TutorProvider } from "@/context/TutorContext";
import { TutorSidebar } from "@/components/TutorSidebar";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { HomepageRedirect } from "@/components/HomepageRedirect";
import { PWAUpdateToast } from "@/components/PWAUpdateToast";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["100", "400", "700", "800"],
});

export const metadata: Metadata = {
  title: "MATHPREP_AI // PCSTYLE",
  description: "Generuj rozbudowane plany nauki matematyki z pomocą AI.",
  manifest: "/manifest.webmanifest",
  themeColor: "#000000",
  icons: {
    icon: "/pwa-icon.svg",
    apple: "/pwa-icon.svg",
  },
  openGraph: {
    title: "MATHPREP_AI // PCSTYLE",
    description: "Generuj rozbudowane plany nauki matematyki z pomocą AI.",
    url: "https://math.pcstyle.dev",
    siteName: "MATHPREP.PCSTYLE",
    images: [
      {
        url: "https://og.pcstyle.dev/api/og?title=MATHPREP%20AI&subtitle=AI%20Math%20Learning%20Platform&icon=calculator&theme=magenta",
        width: 1200,
        height: 630,
        alt: "MathPrep AI Preview",
      },
    ],
    locale: "pl_PL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MATHPREP_AI // PCSTYLE",
    description: "Generuj rozbudowane plany nauki matematyki z pomocą AI.",
    images: ["https://og.pcstyle.dev/api/og?title=MATHPREP%20AI&subtitle=AI%20Math%20Learning%20Platform&icon=calculator&theme=magenta"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={`${jetbrainsMono.variable} antialiased`}>
        <AuthKitProvider>
          <ConvexClientProvider>
            <ThemeProvider>
              <TutorProvider>
                <ThemeEffects />
                <ServiceWorkerRegistrar />
                <PWAUpdateToast />
                <HomepageRedirect />
                <div className="relative z-10">{children}</div>
                <TutorSidebar />
              </TutorProvider>
            </ThemeProvider>
          </ConvexClientProvider>
        </AuthKitProvider>
      </body>
    </html>
  );
}
