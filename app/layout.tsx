import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { BackendAuthProvider } from "@/context/backend-auth";
import { shadcn } from "@clerk/themes";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Supogen",
  description: "A support agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      afterSignOutUrl="https://supogen.com"
    >
      <html lang="en" className="h-full overflow-hidden">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased h-full overflow-hidden`}
        >
          <BackendAuthProvider>
            {children}
          </BackendAuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
