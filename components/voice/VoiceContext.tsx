"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { playVoiceChime } from "@/lib/audio/soundEffects";

export interface VoiceState {
  currentRoomId: string | null;
  currentRoomName: string | null;
  isMuted: boolean;
  isDeafened: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  joinRoom: (room: { id: string; name: string }) => void;
  leaveRoom: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  toggleScreenShare: () => void;
}

const VoiceContext = createContext<VoiceState | null>(null);

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [currentRoomName, setCurrentRoomName] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const joinRoom = (room: { id: string; name: string }) => {
    if (currentRoomId === room.id) return;
    playVoiceChime("join");
    setCurrentRoomId(room.id);
    setCurrentRoomName(room.name);
    setIsMuted(false);
    setIsDeafened(false);
  };

  const leaveRoom = () => {
    if (!currentRoomId) return;
    playVoiceChime("leave");
    setCurrentRoomId(null);
    setCurrentRoomName(null);
    setIsScreenSharing(false);
    setIsSpeaking(false);
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      playVoiceChime(next ? "mute" : "unmute");
      if (next) setIsSpeaking(false);
      return next;
    });
  };

  const toggleDeafen = () => {
    setIsDeafened((prev) => {
      const next = !prev;
      playVoiceChime(next ? "mute" : "unmute");
      return next;
    });
  };

  const toggleScreenShare = () => {
    setIsScreenSharing((prev) => !prev);
  };

  // Keyboard shortcuts (Ctrl+Shift+M for Mute, Ctrl+Shift+D for Deafen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        if (e.key.toLowerCase() === "m") {
          e.preventDefault();
          if (currentRoomId) toggleMute();
        } else if (e.key.toLowerCase() === "d") {
          e.preventDefault();
          if (currentRoomId) toggleDeafen();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentRoomId]);

  return (
    <VoiceContext.Provider
      value={{
        currentRoomId,
        currentRoomName,
        isMuted,
        isDeafened,
        isScreenSharing,
        isSpeaking,
        joinRoom,
        leaveRoom,
        toggleMute,
        toggleDeafen,
        toggleScreenShare,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice(): VoiceState {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error("useVoice must be used within a VoiceProvider");
  }
  return context;
}

