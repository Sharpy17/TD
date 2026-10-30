import type { VoiceRoom } from "@/lib/domain/types";

export function VoiceLounges({ rooms }: { rooms: VoiceRoom[] }) {
  return (
    <section className="side-card" aria-labelledby="voice-title">
      <div className="section-heading section-heading--compact">
        <div><span className="eyebrow">Presence</span><h2 id="voice-title">Voice lounges</h2></div>
        <button className="icon-button" type="button" aria-label="Create voice room">+</button>
      </div>
      <div className="voice-list">
        {rooms.map((room) => (
          <button className="voice-room" type="button" key={room.id}>
            <span className="voice-room__signal">◖))</span>
            <span className="voice-room__copy"><strong>{room.name}</strong><small>{room.members.length ? `${room.members.length} in room` : "Quiet right now"}</small></span>
            <span className="avatar-stack">
              {room.members.slice(0, 3).map((member) => <span className={`avatar avatar--small ${member.speaking ? "avatar--speaking" : ""}`} key={member.id}>{member.initials}</span>)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
