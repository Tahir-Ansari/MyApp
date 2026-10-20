import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
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
  title: {
    default: "DevOps Quest: Learn Docker & Kubernetes",
    template: "%s · DevOps Quest",
  },
  description:
    "A gamified, hands-on course that takes you from zero to confident with Docker and Kubernetes through short lessons, quizzes, and a safe simulated terminal.",
  applicationName: "DevOps Quest",
};

export const viewport: Viewport = {
  themeColor: "#080b08",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
