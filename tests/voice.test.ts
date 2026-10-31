import { describe, expect, it } from "vitest";
import {
  createVoiceRoom,
  deleteVoiceRoom,
  getVoiceRooms,
} from "../lib/voice/service";

describe("Voice Lounges Service (lib/voice/service)", () => {
  it("fetches voice rooms and seeds defaults if empty", async () => {
    const rooms = await getVoiceRooms();
    expect(rooms.length).toBeGreaterThanOrEqual(3);
    const roomNames = rooms.map((r) => r.name);
    expect(roomNames).toContain("Dev-General");
    expect(roomNames).toContain("Chill Lounge");
  });

  it("validates room name constraints", async () => {
    const shortName = await createVoiceRoom({ name: " " });
    expect(shortName.success).toBe(false);
    expect(shortName.error).toContain("must be at least 2 characters");

    const longName = await createVoiceRoom({ name: "V".repeat(55) });
    expect(longName.success).toBe(false);
    expect(longName.error).toContain("cannot exceed 50 characters");
  });

  it("creates and deletes a voice lounge in database", async () => {
    const createRes = await createVoiceRoom({
      name: "Pair-Programming-Test",
      maxUsers: 8,
    });
    expect(createRes.success).toBe(true);
    expect(createRes.roomId).toBeDefined();

    const roomsAfter = await getVoiceRooms();
    const created = roomsAfter.find((r) => r.id === createRes.roomId);
    expect(created).toBeDefined();
    expect(created?.name).toBe("Pair-Programming-Test");

    // Clean up
    const deleteRes = await deleteVoiceRoom(createRes.roomId!);
    expect(deleteRes.success).toBe(true);

    // Deleting again fails gracefully
    const deleteAgain = await deleteVoiceRoom(createRes.roomId!);
    expect(deleteAgain.success).toBe(false);
    expect(deleteAgain.error).toContain("Voice room not found");
  });
});

