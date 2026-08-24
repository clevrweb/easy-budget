import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { PwaRegister } from "@/components/pwa-register";
import { LanguageProvider } from "@/components/language-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Budget Whisperer — Track bills. Master money.",
  description: "A simple, powerful bill tracking and budget management app.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Budget Whisperer",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3bed",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const lang = store.get("lang")?.value ?? "en";

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <LanguageProvider lang={lang}>
            {children}
          </LanguageProvider>
        </ThemeProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
