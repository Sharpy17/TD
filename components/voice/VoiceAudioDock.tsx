"use client";

import { useVoice } from "./VoiceContext";
import { Icon } from "@/components/ui/Icon";

export function VoiceAudioDock() {
  const {
    currentRoomId,
    currentRoomName,
    isMuted,
    isDeafened,
    isScreenSharing,
    leaveRoom,
    toggleMute,
    toggleDeafen,
    toggleScreenShare,
  } = useVoice();

  if (!currentRoomId) return null;

  return (
    <aside className="voice-audio-dock" aria-label="Active voice connection">
      {/* Connection Info */}
      <div className="voice-audio-dock__info">
        <span className="voice-audio-dock__signal-dot" />
        <div className="voice-audio-dock__text">
          <strong title={currentRoomName || "Voice Room"}>
            #{currentRoomName || "Voice Room"}
          </strong>
          <small>
            RTC 24ms &bull; <span className="voice-audio-dock__state">Voice Connected</span>
          </small>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="voice-audio-dock__actions">
        {/* Mute Button */}
        <button
          type="button"
          className={`dock-action-btn ${isMuted ? "dock-action-btn--muted" : ""}`}
          onClick={toggleMute}
          title={isMuted ? "Unmute microphone (Ctrl+Shift+M)" : "Mute microphone (Ctrl+Shift+M)"}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          <Icon name={isMuted ? "micOff" : "mic"} />
          <span className="dock-btn-label">{isMuted ? "Muted" : "Mute"}</span>
        </button>

        {/* Deafen Button */}
        <button
          type="button"
          className={`dock-action-btn ${isDeafened ? "dock-action-btn--deafened" : ""}`}
          onClick={toggleDeafen}
          title={isDeafened ? "Undeafen headphones (Ctrl+Shift+D)" : "Deafen headphones (Ctrl+Shift+D)"}
          aria-label={isDeafened ? "Undeafen" : "Deafen"}
        >
          <Icon name={isDeafened ? "headphonesOff" : "headphones"} />
          <span className="dock-btn-label">{isDeafened ? "Deafened" : "Deafen"}</span>
        </button>

        {/* Screen Share */}
        <button
          type="button"
          className={`dock-action-btn ${isScreenSharing ? "dock-action-btn--active" : ""}`}
          onClick={toggleScreenShare}
          title={isScreenSharing ? "Stop screen share" : "Share screen"}
          aria-label={isScreenSharing ? "Stop screen sharing" : "Share screen"}
        >
          <Icon name="screen" />
          <span className="dock-btn-label">{isScreenSharing ? "Sharing" : "Share"}</span>
        </button>

        {/* Disconnect */}
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
  );
}

