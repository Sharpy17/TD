"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { RemoteParticipant, RemoteTrack, RemoteTrackPublication, Room } from "livekit-client";
import { useLive } from "@/components/live/LiveContext";
import { playVoiceChime } from "@/lib/audio/soundEffects";
import type { VoiceRoom } from "@/lib/domain/types";

const STATE_HEARTBEAT_MS = 15_000;
const CONNECT_TIMEOUT_MS = 45_000;

export type VoiceStatus = "idle" | "connecting" | "connected" | "reconnecting";
export type RemoteScreen = { participantId: string; name: string; track: RemoteTrack };
export type MicDevice = { id: string; label: string };

export interface VoiceState {
  currentRoomId: string | null;
  currentRoomName: string | null;
  status: VoiceStatus;
  error: string | null;
  audioBlocked: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  screens: RemoteScreen[];
  microphones: MicDevice[];
  activeMicrophone: string | null;
  membersOf: (roomId: string) => VoiceRoom["members"];
  joinRoom: (room: { id: string; name: string }) => void;
  leaveRoom: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  toggleScreenShare: () => void;
  selectMicrophone: (deviceId: string) => void;
  resumeAudio: () => void;
  dismissError: () => void;
}

const VoiceContext = createContext<VoiceState | null>(null);

/** Rooms named "silent" are for working side by side, so people arrive muted. */
const joinsMuted = (roomName: string) => /silent/i.test(roomName);

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const { voiceMembers } = useLive();
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [currentRoomName, setCurrentRoomName] = useState<string | null>(null);
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [identity, setIdentity] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [speakers, setSpeakers] = useState<ReadonlySet<string>>(new Set());
  const [screens, setScreens] = useState<RemoteScreen[]>([]);
  const [microphones, setMicrophones] = useState<MicDevice[]>([]);
  const [activeMicrophone, setActiveMicrophone] = useState<string | null>(null);

  const roomRef = useRef<Room | null>(null);
  const attemptRef = useRef(0);
  const leavingRef = useRef(false);
  const deafenedRef = useRef(false);
  const mutedBeforeDeafenRef = useRef(false);
  const audioHostRef = useRef<HTMLDivElement>(null);

  const resetCall = useCallback(() => {
    roomRef.current = null;
    deafenedRef.current = false;
    setCurrentRoomId(null);
    setCurrentRoomName(null);
    setStatus("idle");
    setAudioBlocked(false);
    setIdentity(null);
    setIsMuted(false);
    setIsDeafened(false);
    setIsScreenSharing(false);
    setSpeakers(new Set());
    setScreens([]);
    if (audioHostRef.current) audioHostRef.current.textContent = "";
  }, []);

  const reportState = useCallback(
    (body: { roomId: string | null; muted: boolean; deafened: boolean; sharing: boolean }) =>
      fetch("/api/voice/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        keepalive: true,
      }).catch(() => {}),
    [],
  );

  const disconnect = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    leavingRef.current = true;
    await room.disconnect();
    leavingRef.current = false;
    resetCall();
  }, [resetCall]);

  const refreshMicrophones = useCallback(async (room: Room) => {
    const { Room: LiveKitRoom } = await import("livekit-client");
    const devices = await LiveKitRoom.getLocalDevices("audioinput").catch(() => []);
    setMicrophones(devices.map((device, index) => ({ id: device.deviceId, label: device.label || `Microphone ${index + 1}` })));
    setActiveMicrophone(room.getActiveDevice("audioinput") ?? null);
  }, []);

  const joinRoom = useCallback(
    async (target: { id: string; name: string }) => {
      const attempt = ++attemptRef.current;
      const isCurrent = () => attempt === attemptRef.current;

      await disconnect();
      setError(null);
      setCurrentRoomId(target.id);
      setCurrentRoomName(target.name);
      setStatus("connecting");

      // A join can stall without ever failing, so the whole attempt gets a deadline.
      const deadline = setTimeout(() => {
        if (!isCurrent()) return;
        attemptRef.current += 1;
        const stalled = roomRef.current;
        resetCall();
        void stalled?.disconnect();
        setError("Voice took too long to connect. Check your connection and try again.");
      }, CONNECT_TIMEOUT_MS);

      try {
        const response = await fetch("/api/voice/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: target.id }),
        });
        const pass = (await response.json()) as { url?: string; token?: string; identity?: string; error?: string };
        if (!response.ok || !pass.url || !pass.token) throw new Error(pass.error ?? "Couldn't join voice.");

        const { DisconnectReason, Room: LiveKitRoom, RoomEvent, Track, ConnectionState } = await import("livekit-client");
        if (!isCurrent()) return;

        const room = new LiveKitRoom({
          adaptiveStream: true,
          dynacast: true,
          audioCaptureDefaults: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
          },
          publishDefaults: { audioPreset: { maxBitrate: 64_000 }, dtx: true, red: true },
        });

        room
          .on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _publication: RemoteTrackPublication, participant: RemoteParticipant) => {
            if (track.kind === Track.Kind.Audio) {
              const element = track.attach() as HTMLAudioElement;
              element.muted = deafenedRef.current;
              audioHostRef.current?.append(element);
            } else if (track.source === Track.Source.ScreenShare) {
              setScreens((items) => [
                ...items,
                { participantId: participant.identity, name: participant.name || "Teammate", track },
              ]);
            }
          })
          .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
            track.detach().forEach((element) => element.remove());
            setScreens((items) => items.filter((item) => item.track !== track));
          })
          .on(RoomEvent.ActiveSpeakersChanged, (active) => {
            setSpeakers(new Set(active.map((participant) => participant.identity)));
          })
          .on(RoomEvent.ConnectionStateChanged, (state) => {
            if (state === ConnectionState.Connected) setStatus("connected");
            if (state === ConnectionState.Reconnecting || state === ConnectionState.SignalReconnecting) setStatus("reconnecting");
          })
          .on(RoomEvent.AudioPlaybackStatusChanged, () => setAudioBlocked(!room.canPlaybackAudio))
          .on(RoomEvent.LocalTrackUnpublished, (publication) => {
            // The browser's own "Stop sharing" button ends the share without going through the dock.
            if (publication.source === Track.Source.ScreenShare) setIsScreenSharing(false);
          })
          .on(RoomEvent.Disconnected, (reason) => {
            if (leavingRef.current || roomRef.current !== room) return;
            resetCall();
            setError(
              reason === DisconnectReason.DUPLICATE_IDENTITY
                ? "You joined voice from another tab or device."
                : "Voice disconnected. Join the room again to reconnect.",
            );
          });

        roomRef.current = room;
        await room.connect(pass.url, pass.token);
        clearTimeout(deadline);
        if (!isCurrent()) {
          leavingRef.current = true;
          await room.disconnect();
          leavingRef.current = false;
          return;
        }

        setIdentity(pass.identity ?? null);
        setStatus("connected");
        playVoiceChime("join");
        await room.startAudio().catch(() => {});
        setAudioBlocked(!room.canPlaybackAudio);

        const startMuted = joinsMuted(target.name);
        setIsMuted(startMuted);
        if (!startMuted) {
          try {
            await room.localParticipant.setMicrophoneEnabled(true);
          } catch {
            setIsMuted(true);
            setError("Your microphone is blocked. Allow it in the browser, then unmute. You can still listen.");
          }
        }
        await refreshMicrophones(room);
      } catch (err) {
        clearTimeout(deadline);
        if (!isCurrent()) return;
        const failed = roomRef.current;
        resetCall();
        void failed?.disconnect().catch(() => {});
        setError(err instanceof Error ? err.message : "Couldn't join voice.");
      }
    },
    [disconnect, refreshMicrophones, resetCall],
  );

  const leaveRoom = useCallback(() => {
    attemptRef.current += 1;
    if (!roomRef.current) {
      resetCall();
      return;
    }
    playVoiceChime("leave");
    void disconnect();
    void reportState({ roomId: null, muted: false, deafened: false, sharing: false });
  }, [disconnect, reportState, resetCall]);

  const setMicrophone = useCallback(
    async (muted: boolean) => {
      const room = roomRef.current;
      if (!room) return;
      try {
        await room.localParticipant.setMicrophoneEnabled(!muted);
        setIsMuted(muted);
        setError(null);
        if (!muted) await refreshMicrophones(room);
      } catch {
        setIsMuted(true);
        setError("Your microphone is blocked. Allow it in the browser, then unmute.");
      }
    },
    [refreshMicrophones],
  );

  const toggleMute = useCallback(() => {
    if (deafenedRef.current) return;
    const next = !isMuted;
    playVoiceChime(next ? "mute" : "unmute");
    void setMicrophone(next);
  }, [isMuted, setMicrophone]);

  const toggleDeafen = useCallback(() => {
    const next = !deafenedRef.current;
    deafenedRef.current = next;
    setIsDeafened(next);
    playVoiceChime(next ? "mute" : "unmute");
    audioHostRef.current?.querySelectorAll("audio").forEach((element) => {
      element.muted = next;
    });
    // Deafening also silences your mic, and undeafening puts it back how it was.
    if (next) {
      mutedBeforeDeafenRef.current = isMuted;
      void setMicrophone(true);
    } else {
      void setMicrophone(mutedBeforeDeafenRef.current);
    }
  }, [isMuted, setMicrophone]);

  const toggleScreenShare = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !isScreenSharing;
    try {
      await room.localParticipant.setScreenShareEnabled(next, {
        audio: false,
        contentHint: "detail",
        resolution: { width: 1920, height: 1080, frameRate: 30 },
      });
      setIsScreenSharing(next);
    } catch (err) {
      // Closing the browser's picker is a normal way to say no.
      if (err instanceof Error && err.name !== "NotAllowedError") setError("Couldn't share your screen.");
      setIsScreenSharing(false);
    }
  }, [isScreenSharing]);

  const selectMicrophone = useCallback(async (deviceId: string) => {
    const room = roomRef.current;
    if (!room) return;
    await room.switchActiveDevice("audioinput", deviceId).catch(() => setError("Couldn't switch microphone."));
    setActiveMicrophone(room.getActiveDevice("audioinput") ?? deviceId);
  }, []);

  const resumeAudio = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    await room.startAudio().catch(() => {});
    setAudioBlocked(!room.canPlaybackAudio);
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  // Heartbeat: everyone else's member lists come from this.
  const inCall = status === "connected" || status === "reconnecting";
  useEffect(() => {
    if (!inCall || !currentRoomId) return;
    const beat = () =>
      reportState({ roomId: currentRoomId, muted: isMuted, deafened: isDeafened, sharing: isScreenSharing });
    void beat();
    const timer = setInterval(beat, STATE_HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, [inCall, currentRoomId, isMuted, isDeafened, isScreenSharing, reportState]);

  // Closing the tab leaves the room straight away instead of waiting for the heartbeat to lapse.
  useEffect(() => {
    if (!inCall) return;
    const onPageHide = () => {
      const body = JSON.stringify({ roomId: null, muted: false, deafened: false, sharing: false });
      navigator.sendBeacon("/api/voice/state", new Blob([body], { type: "application/json" }));
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [inCall]);

  // Keyboard shortcuts (Ctrl+Shift+M for Mute, Ctrl+Shift+D for Deafen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || !e.shiftKey || !currentRoomId) return;
      if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        toggleMute();
      } else if (e.key.toLowerCase() === "d") {
        e.preventDefault();
        toggleDeafen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentRoomId, toggleMute, toggleDeafen]);

  const membersOf = useCallback(
    (roomId: string) =>
      voiceMembers
        .filter((member) => member.roomId === roomId)
        .map((member) => ({
          id: member.userId,
          name: member.name,
          initials: member.initials,
          muted: member.muted,
          speaking: speakers.has(member.userId),
        })),
    [voiceMembers, speakers],
  );

  const value = useMemo<VoiceState>(
    () => ({
      currentRoomId,
      currentRoomName,
      status,
      error,
      audioBlocked,
      isMuted,
      isDeafened,
      isScreenSharing,
      isSpeaking: !!identity && speakers.has(identity),
      screens,
      microphones,
      activeMicrophone,
      membersOf,
      joinRoom: (room) => void joinRoom(room),
      leaveRoom,
      toggleMute,
      toggleDeafen,
      toggleScreenShare: () => void toggleScreenShare(),
      selectMicrophone: (deviceId) => void selectMicrophone(deviceId),
      resumeAudio: () => void resumeAudio(),
      dismissError,
    }),
    [
      currentRoomId, currentRoomName, status, error, audioBlocked, isMuted, isDeafened, isScreenSharing, identity,
      speakers, screens, microphones, activeMicrophone, membersOf, joinRoom, leaveRoom, toggleMute, toggleDeafen,
      toggleScreenShare, selectMicrophone, resumeAudio, dismissError,
    ],
  );

  return (
    <VoiceContext.Provider value={value}>
      {children}
      <div ref={audioHostRef} hidden />
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
