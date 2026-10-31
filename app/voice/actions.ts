"use server";

import { revalidatePath } from "next/cache";
import { createVoiceRoom, deleteVoiceRoom } from "@/lib/voice/service";

export interface VoiceActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

export async function createVoiceRoomAction(
  _prevState: VoiceActionState | null,
  formData: FormData
): Promise<VoiceActionState> {
  const name = formData.get("name")?.toString() || "";
  const maxUsersRaw = formData.get("maxUsers")?.toString();
  const maxUsers = maxUsersRaw ? parseInt(maxUsersRaw, 10) : 10;
  const projectId = formData.get("projectId")?.toString();

  if (!name.trim()) {
    return {
      error: "Room name cannot be empty.",
      fieldErrors: { name: "Please enter a name for the voice lounge." },
    };
  }

  const result = await createVoiceRoom({
    name: name.trim(),
    maxUsers: isNaN(maxUsers) ? 10 : maxUsers,
  });

  if (!result.success) {
    return { error: result.error || "Failed to create voice lounge." };
  }

  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
  revalidatePath("/projects/toguz-hub");
  revalidatePath("/projects");
  revalidatePath("/");

  return { success: true };
}

export async function deleteVoiceRoomAction(
  roomId: string,
  projectId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!roomId) {
    return { success: false, error: "Missing room ID." };
  }

  const result = await deleteVoiceRoom(roomId);
  if (!result.success) {
    return { success: false, error: result.error || "Failed to delete room." };
  }

  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
  revalidatePath("/projects/toguz-hub");
  revalidatePath("/projects");
  revalidatePath("/");

  return { success: true };
}

