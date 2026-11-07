import { AccessToken } from "livekit-server-sdk";

export const livekitRoomName = (roomId: string) => `voice-${roomId}`;

export function isVoiceConfigured(): boolean {
  return !!(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET);
}

/** A short-lived pass into one room. Identity comes from the session, never from the client. */
export async function createVoiceToken(input: { roomId: string; userId: string; name: string }) {
  const token = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: input.userId,
    name: input.name,
    ttl: "6h",
  });
  token.addGrant({
    room: livekitRoomName(input.roomId),
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: false,
  });
  return { url: process.env.LIVEKIT_URL as string, token: await token.toJwt() };
}
