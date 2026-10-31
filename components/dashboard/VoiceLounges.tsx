"use client";

import { useState } from "react";
import type { VoiceRoom } from "@/lib/domain/types";
import { useVoice } from "@/components/voice/VoiceContext";
import { CreateVoiceRoomModal } from "@/components/voice/CreateVoiceRoomModal";

export function VoiceLounges({
  rooms,
  projectId,
}: {
  rooms: VoiceRoom[];
  projectId?: string;
}) {
  const { currentRoomId, joinRoom, leaveRoom, isMuted, isSpeaking } = useVoice();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleRoomClick = (room: VoiceRoom) => {
    if (currentRoomId === room.id) {
      // Clicking the already active room toggles leave or leaves
      leaveRoom();
    } else {
      joinRoom({ id: room.id, name: room.name });
    }
  };

  return (
    <>
      <section className="side-card" aria-labelledby="voice-title">
        <div className="section-heading section-heading--compact">
          <div>
            <span className="eyebrow">Presence</span>
            <h2 id="voice-title">Voice lounges</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Create voice room"
            title="Create voice lounge"
            onClick={() => setIsCreateModalOpen(true)}
          >
            +
          </button>
        </div>

        <div className="voice-list">
          {rooms.map((room) => {
            const isCurrentRoom = currentRoomId === room.id;

            // Include current user in members if they are in this room
            const displayMembers = [...room.members];
            if (isCurrentRoom && !displayMembers.some((m) => m.id === "me")) {
              displayMembers.unshift({
                id: "me",
                name: "You",
                initials: "YOU",
                muted: isMuted,
                speaking: isSpeaking,
              });
            }

            return (
              <button
                className={`voice-room ${isCurrentRoom ? "voice-room--active" : ""}`}
                type="button"
                key={room.id}
                onClick={() => handleRoomClick(room)}
                title={isCurrentRoom ? "Click to disconnect" : `Join #${room.name}`}
              >
                <span className="voice-room__signal">
                  {isCurrentRoom ? "🔊" : "◖))"}
                </span>
                <span className="voice-room__copy">
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <strong>{room.name}</strong>
                    {isCurrentRoom && (
                      <span className="voice-badge voice-badge--live">LIVE</span>
                    )}
                  </div>
                  <small>
                    {isCurrentRoom
                      ? "Connected • Click to leave"
                      : displayMembers.length
                      ? `${displayMembers.length} in room`
                      : "Quiet right now"}
                  </small>
                </span>
                <span className="avatar-stack">
                  {displayMembers.slice(0, 3).map((member) => (
                    <span
                      className={`avatar avatar--small ${
                        member.speaking ? "avatar--speaking" : ""
                      } ${member.muted ? "avatar--muted" : ""}`}
                      key={member.id}
                      title={`${member.name}${member.muted ? " (Muted)" : ""}${
                        member.speaking ? " (Speaking)" : ""
                      }`}
                    >
                      {member.initials}
                    </span>
                  ))}
                  {displayMembers.length > 3 && (
                    <span className="avatar avatar--small avatar--more">
                      +{displayMembers.length - 3}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {isCreateModalOpen && (
        <CreateVoiceRoomModal
          isOpen={true}
          onClose={() => setIsCreateModalOpen(false)}
          projectId={projectId}
        />
      )}
    </>
  );
}
