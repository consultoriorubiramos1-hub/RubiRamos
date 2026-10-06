import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientWrapper from "@/components/layout/ClientWrapper";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { ReactNode } from "react";
import ServiceWorkerRegistration from '@/components/pwa/ServiceWorkerRegistration';

export const metadata: Metadata = {
  title: {
    template: "%s | RubiRamos",
    default: "RubiRamos",
  },
  description:
    "Sistema Integral Multiplataforma para la Gestión de Consultorio Nutricional",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: 'Rubí Ramos', statusBarStyle: 'default' },
  icons: { apple: '/icons/icon-192x192.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#6B8E7B',
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <a className="skip-link" href="#main-content">Ir al contenido</a>
        <ServiceWorkerRegistration />
        <SessionProviderWrapper>
          <ClientWrapper>{children}</ClientWrapper>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
