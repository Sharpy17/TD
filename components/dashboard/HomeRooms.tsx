"use client";

import type { VoiceRoom } from "@/lib/domain/types";
import { useVoice } from "@/components/voice/VoiceContext";
import { Icon } from "@/components/ui/Icon";

/** Voice rooms on Home: one list, and the room you are in is highlighted. */
export function HomeRooms({ rooms }: { rooms: VoiceRoom[] }) {
  const { currentRoomId, joinRoom, leaveRoom, membersOf } = useVoice();

  if (rooms.length === 0) {
    return <p className="attention-list attention-empty">No voice rooms yet. Create one from a project.</p>;
  }

  return (
    <ul className="room-list">
      {rooms.map((room) => {
        const live = currentRoomId === room.id;
        const members = membersOf(room.id);
        const count = members.length;
        return (
          <li className={`room-row ${live ? "room-row--live" : ""}`} key={room.id}>
            <i className="room-row__dot" aria-hidden="true" />
            <div className="room-row__copy">
              <strong>{room.name}</strong>
              <small>{live ? "You are connected" : count > 0 ? `${count} in room` : "Quiet"}</small>
            </div>
            {members.length > 0 && (
              <span className="avatar-stack">
                {members.slice(0, 3).map((member) => (
                  <span
                    key={member.id}
                    className={`avatar avatar--small ${member.speaking ? "avatar--speaking" : ""}`}
                    title={member.name}
                  >
                    {member.initials}
                  </span>
                ))}
              </span>
            )}
            {live ? (
              <button className="room-row__action room-row__action--leave" type="button" onClick={leaveRoom}>
                <Icon name="phoneOff" size={14} /> Leave
              </button>
            ) : (
              <button
                className="room-row__action"
                type="button"
                onClick={() => joinRoom({ id: room.id, name: room.name })}
                aria-label={`Join ${room.name}`}
              >
                Join
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
