import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";
import "./globals.css";
// Depois do globals: sobrescreve tokens/superfícies em telas pequenas.
import "./responsive.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fazenda — Gestão pecuária",
  description: "Sistema de gestão de fazenda e rebanho",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Permite usar env(safe-area-inset-*) em aparelhos com notch / barra de gestos.
  viewportFit: "cover",
  themeColor: "#3d4f2f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${fraunces.variable} ${sourceSans.variable} antialiased`}>
        <AuthProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
