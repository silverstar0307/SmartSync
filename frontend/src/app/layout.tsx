import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Sync - College Communities",
  description: "Connect with college peers based on shared interests",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" style={{ colorScheme: "light" }}>
      <body className={`${inter.className} text-[#0F172A] bg-[#F8FAFC]`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
