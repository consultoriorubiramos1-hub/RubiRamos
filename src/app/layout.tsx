import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientWrapper from "@/components/layout/ClientWrapper";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    template: "%s | RubiRamos",
    default: "RubiRamos",
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <SessionProviderWrapper>
          <ClientWrapper>{children}</ClientWrapper>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}