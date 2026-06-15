import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import IframeResizer from "@/components/IframeResizer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rate Calculators",
  description: "Free car loan rate calculator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <IframeResizer />
        {children}
      </body>
    </html>
  );
}
