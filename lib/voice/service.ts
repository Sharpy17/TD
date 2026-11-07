import { prisma } from "@/lib/prisma";
import type { VoiceRoom } from "@/lib/domain/types";

export interface VoiceRoomResult {
  success: boolean;
  roomId?: string;
  error?: string;
}

export interface CreateVoiceRoomInput {
  name: string;
  workspaceId?: string;
  maxUsers?: number;
}

const DEFAULT_ROOMS = [
  { name: "Dev-General", maxUsers: 15 },
  { name: "Pair-Programming", maxUsers: 4 },
  { name: "Chill Lounge", maxUsers: 20 },
  { name: "Silent Focus", maxUsers: 10 },
];

/**
 * Ensures a default workspace exists and returns its ID.
 */
async function getOrCreateDefaultWorkspaceId(): Promise<string> {
  const existing = await prisma.workspace.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (existing) return existing.id;

  const created = await prisma.workspace.create({
    data: {
      name: "Startup Workspace",
      slug: "startup-workspace",
    },
  });

  return created.id;
}

/**
 * Seeds default Discord-style voice lounges if none exist in the workspace.
 */
export async function ensureDefaultVoiceRoomsSeeded(workspaceId?: string): Promise<void> {
  try {
    const wsId = workspaceId || (await getOrCreateDefaultWorkspaceId());
    const count = await prisma.voiceRoom.count({
      where: { workspaceId: wsId },
    });

    if (count === 0) {
      await prisma.voiceRoom.createMany({
        data: DEFAULT_ROOMS.map((r) => ({
          name: r.name,
          maxUsers: r.maxUsers,
          workspaceId: wsId,
        })),
      });
    }
  } catch (err) {
    console.error("[ensureDefaultVoiceRoomsSeeded] Error:", err);
  }
}

/**
 * Fetches all voice rooms for the workspace.
 */
export async function getVoiceRooms(workspaceId?: string): Promise<VoiceRoom[]> {
  try {
    const wsId = workspaceId || (await getOrCreateDefaultWorkspaceId());
    await ensureDefaultVoiceRoomsSeeded(wsId);

    const dbRooms = await prisma.voiceRoom.findMany({
      where: { workspaceId: wsId },
      orderBy: { createdAt: "asc" },
    });

    return dbRooms.map((r) => ({
      id: r.id,
      name: r.name,
      maxUsers: r.maxUsers,
      members: [],
    }));
  } catch (err) {
    console.error("[getVoiceRooms] Error fetching rooms:", err);
    // Fallback to default in-memory rooms if DB connection fails
    return DEFAULT_ROOMS.map((r, idx) => ({
      id: `room_${idx + 1}`,
      name: r.name,
      members: [],
    }));
  }
}

/**
 * Creates a new voice room in the workspace.
 */
export async function createVoiceRoom(input: CreateVoiceRoomInput): Promise<VoiceRoomResult> {
  const trimmedName = input.name.trim();

  if (trimmedName.length < 2) {
    return {
      success: false,
      error: "Room name must be at least 2 characters.",
    };
  }

  if (trimmedName.length > 50) {
    return {
      success: false,
      error: "Room name cannot exceed 50 characters.",
    };
  }

  try {
    const wsId = input.workspaceId || (await getOrCreateDefaultWorkspaceId());

    const created = await prisma.voiceRoom.create({
      data: {
        name: trimmedName,
        maxUsers: input.maxUsers || 10,
        workspaceId: wsId,
      },
    });

    return {
      success: true,
      roomId: created.id,
    };
  } catch (err) {
    console.error("[createVoiceRoom] Error creating voice room:", err);
    return {
      success: false,
      error: "Failed to create voice room. Please verify database connectivity.",
    };
  }
}

/**
 * Deletes a voice room by ID.
 */
export async function deleteVoiceRoom(roomId: string): Promise<{ success: boolean; error?: string }> {
  if (!roomId) {
    return { success: false, error: "Missing room ID." };
  }

  try {
    const existing = await prisma.voiceRoom.findUnique({
      where: { id: roomId },
    });

    if (!existing) {
      return { success: false, error: "Voice room not found." };
    }

    await prisma.voiceRoom.delete({
      where: { id: roomId },
    });

    return { success: true };
  } catch (err) {
    console.error(`[deleteVoiceRoom] Error deleting voice room ${roomId}:`, err);
    return {
      success: false,
      error: "Failed to delete voice room.",
    };
  }
}
