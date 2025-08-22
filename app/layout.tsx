import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Kufam } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./provider";

const kufam = Kufam({
  variable: "--font-kufam",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mustafa Hasanain's Portfolio",
  description: "High performance Web Apps with Seamless User Experiences",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={kufam.variable}>
      <head>
        {/* Add Favicon */}
        <link rel="icon" href="/draft5.png" sizes="any" />
        {/* Preload critical resources */}
        <link rel="preload" href="/draft5.png" as="image" />
        <link rel="preload" href="/bg.png" as="image" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Critical CSS optimization */}
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html { font-family: var(--font-kufam), sans-serif; }
          body { 
            background: #000; 
            color: #fff; 
            overflow-x: hidden;
          }
          .pb-20 { padding-bottom: 5rem; }
          .pt-36 { padding-top: 9rem; }
          .relative { position: relative; }
          .absolute { position: absolute; }
          .flex { display: flex; }
          .items-center { align-items: center; }
          .justify-center { justify-content: center; }
          .text-center { text-align: center; }
          .w-full { width: 100%; }
          .h-screen { height: 100vh; }
          .bg-black-100 { background-color: rgb(4,7,29); }
          .text-purple { color: #CBACF9; }
          @media (min-width: 768px) {
            .md\\:text-5xl { font-size: 3rem; }
          }
          @media (min-width: 1024px) {
            .lg\\:text-6xl { font-size: 3.75rem; }
          }
        `}</style>
      </head>
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