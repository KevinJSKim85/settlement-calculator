import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "정산서 | Settlement Calculator",
  description: "정산 계산기 — Settlement Calculator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0A0A0A]">
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: '#1E1E1E',
              border: '1px solid #2A2A2A',
              color: '#F0F0F0',
            },
          }}
        />
      </body>
    </html>
  );
}
