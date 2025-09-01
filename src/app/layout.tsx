import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trading Bot - 90% Prediction Confidence",
  description: "Advanced AI-powered trading bot with 90% prediction confidence and automated risk management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "min-h-screen bg-slate-50")}>
        {children}
      </body>
    </html>
  );
}