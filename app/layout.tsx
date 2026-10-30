import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Toguz Hub",
  description: "A fast project hub for startup teams.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
