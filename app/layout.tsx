import type { Metadata } from "next";
import "./globals.css";
import { VoiceProvider } from "@/components/voice/VoiceContext";
import { VoiceAudioDock } from "@/components/voice/VoiceAudioDock";

export const metadata: Metadata = {
  title: "Toguz Hub",
  description: "A fast project hub for startup teams.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <VoiceProvider>
          {children}
          <VoiceAudioDock />
        </VoiceProvider>
      </body>
    </html>
  );
}
