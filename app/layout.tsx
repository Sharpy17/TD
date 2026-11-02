import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { VoiceProvider } from "@/components/voice/VoiceContext";
import { VoiceAudioDock } from "@/components/voice/VoiceAudioDock";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "DaiHub",
  description: "A fast project hub for startup teams.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${jetbrains.variable}`}>
      <body>
        <VoiceProvider>
          {children}
          <VoiceAudioDock />
        </VoiceProvider>
      </body>
    </html>
  );
}
