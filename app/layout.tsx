import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Kufam } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const kufam = Kufam({
  variable: "--font-kufam",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mustafa Hasanain's Portfolio",
  description: "Building high-performance Web Applications with modern Web Technologies",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={kufam.variable}>
      <head />
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}