import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZeroPulse — Live architecture map + AI advisor for Zerops",
  description:
    "Point ZeroPulse at your Zerops project and watch its live service topology render, cache it over the private network, and get an AI architecture review of your zerops.yaml.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="zp-backdrop min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
