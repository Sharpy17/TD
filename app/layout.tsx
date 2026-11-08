import type { Metadata } from "next";
import { DM_Mono, Urbanist } from "next/font/google";
import "./globals.css";
import { LiveProvider } from "@/components/live/LiveContext";
import { VoiceProvider } from "@/components/voice/VoiceContext";
import { VoiceAudioDock } from "@/components/voice/VoiceAudioDock";

const urbanist = Urbanist({ subsets: ["latin"], variable: "--font-urbanist" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono" });

export const metadata: Metadata = {
  title: "DaiHub",
  description: "A fast project hub for startup teams.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${urbanist.variable} ${dmMono.variable}`}>
      <body>
        <LiveProvider>
          <VoiceProvider>
            {children}
            <VoiceAudioDock />
          </VoiceProvider>
        </LiveProvider>
      </body>
    </html>
  );
}
