"use client";

import { useEffect, useRef, useState } from "react";
import { useVoice, type RemoteScreen, type VoiceStatus } from "./VoiceContext";
import { Icon } from "@/components/ui/Icon";

const STATUS_LABEL: Record<VoiceStatus, string> = {
  idle: "Disconnected",
  connecting: "Connecting…",
  connected: "Connected",
  reconnecting: "Reconnecting…",
};

/** A teammate's shared screen. Click to enlarge. */
function ScreenTile({ screen }: { screen: RemoteScreen }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    screen.track.attach(video);
    return () => {
      screen.track.detach(video);
    };
  }, [screen.track]);

  return (
    <figure className={`voice-screen ${expanded ? "voice-screen--expanded" : ""}`}>
      <figcaption>
        <span>{screen.name}&apos;s screen</span>
        <button type="button" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Shrink" : "Enlarge"}
        </button>
      </figcaption>
      <video ref={videoRef} autoPlay playsInline muted />
    </figure>
  );
}

export function VoiceAudioDock() {
  const {
    currentRoomId,
    currentRoomName,
    status,
    error,
    audioBlocked,
    isMuted,
    isDeafened,
    isScreenSharing,
    screens,
    microphones,
    activeMicrophone,
    membersOf,
    leaveRoom,
    toggleMute,
    toggleDeafen,
    toggleScreenShare,
    selectMicrophone,
    resumeAudio,
    dismissError,
  } = useVoice();

  const notice = error && (
    <div className="voice-notice" role="alert">
      <Icon name="alert" size={14} />
      <span>{error}</span>
      <button type="button" onClick={dismissError} aria-label="Dismiss">
        <Icon name="close" size={14} />
      </button>
    </div>
  );

  if (!currentRoomId) return error ? <div className="voice-overlay">{notice}</div> : null;

  const members = membersOf(currentRoomId);
  const live = status === "connected";

  return (
    <div className="voice-overlay">
      {screens.length > 0 && (
        <div className="voice-screens">
          {screens.map((screen) => (
            <ScreenTile key={screen.track.sid ?? screen.participantId} screen={screen} />
          ))}
        </div>
      )}
      {notice}
      {audioBlocked && (
        <button type="button" className="voice-notice voice-notice--action" onClick={resumeAudio}>
          <Icon name="speaker" size={14} /> Your browser paused the audio. Click to hear the room.
        </button>
      )}

      <aside className="voice-audio-dock" aria-label="Active voice connection">
        <div className="voice-audio-dock__info">
          <span className={`voice-audio-dock__signal-dot ${live ? "" : "voice-audio-dock__signal-dot--waiting"}`} />
          <div className="voice-audio-dock__text">
            <strong title={currentRoomName || "Voice Room"}>#{currentRoomName || "Voice Room"}</strong>
            <small>
              <span className="voice-audio-dock__state" role="status">{STATUS_LABEL[status]}</span>
              {members.length > 0 && <> &bull; {members.length} here</>}
            </small>
          </div>
          {members.length > 0 && (
            <span className="avatar-stack voice-audio-dock__people">
              {members.slice(0, 4).map((member) => (
                <span
                  key={member.id}
                  className={`avatar avatar--small ${member.speaking ? "avatar--speaking" : ""} ${member.muted ? "avatar--muted" : ""}`}
                  title={`${member.name}${member.muted ? " (Muted)" : ""}`}
                >
                  {member.initials}
                </span>
              ))}
            </span>
          )}
        </div>

        <div className="voice-audio-dock__actions">
          <button
            type="button"
            className={`dock-action-btn ${isMuted ? "dock-action-btn--muted" : ""}`}
            onClick={toggleMute}
            disabled={!live || isDeafened}
            title={isMuted ? "Unmute microphone (Ctrl+Shift+M)" : "Mute microphone (Ctrl+Shift+M)"}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            <Icon name={isMuted ? "micOff" : "mic"} />
            <span className="dock-btn-label">{isMuted ? "Muted" : "Mute"}</span>
          </button>

          <button
            type="button"
            className={`dock-action-btn ${isDeafened ? "dock-action-btn--deafened" : ""}`}
            onClick={toggleDeafen}
            disabled={!live}
            title={isDeafened ? "Undeafen headphones (Ctrl+Shift+D)" : "Deafen headphones (Ctrl+Shift+D)"}
            aria-label={isDeafened ? "Undeafen" : "Deafen"}
          >
            <Icon name={isDeafened ? "headphonesOff" : "headphones"} />
            <span className="dock-btn-label">{isDeafened ? "Deafened" : "Deafen"}</span>
          </button>

          <button
            type="button"
            className={`dock-action-btn ${isScreenSharing ? "dock-action-btn--active" : ""}`}
            onClick={toggleScreenShare}
            disabled={!live}
            title={isScreenSharing ? "Stop screen share" : "Share screen"}
            aria-label={isScreenSharing ? "Stop screen sharing" : "Share screen"}
          >
            <Icon name="screen" />
            <span className="dock-btn-label">{isScreenSharing ? "Sharing" : "Share"}</span>
          </button>

          {microphones.length > 1 && (
            <select
              className="dock-mic-select"
              aria-label="Microphone"
              value={activeMicrophone ?? ""}
              onChange={(event) => selectMicrophone(event.target.value)}
            >
              {microphones.map((microphone) => (
                <option key={microphone.id} value={microphone.id}>{microphone.label}</option>
              ))}
            </select>
          )}

          <button
            type="button"
            className="dock-disconnect-btn"
            onClick={leaveRoom}
            title="Disconnect from voice lounge"
            aria-label="Disconnect"
          >
            <Icon name="phoneOff" />
            <span className="dock-btn-label">Disconnect</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
