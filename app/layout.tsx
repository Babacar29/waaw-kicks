import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import { RegisterServiceWorker } from "./register-sw";
import { Header } from "../components/Header";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Waaw Kicks",
  description: "Sneakers Homme, Femme, Bébé au Sénégal",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#FFD400",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-waaw-black">
        <RegisterServiceWorker />
        <Header />
        {children}
      </body>
    </html>
  );
}
