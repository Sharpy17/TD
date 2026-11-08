import crypto from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { canManageInvites } from "@/lib/workspaces/service";

export const STICKER_MAX_BYTES = 2 * 1024 * 1024;
export const STICKER_MAX_PER_WORKSPACE = 200;
const NAME_MAX_LENGTH = 40;

type ImageType = { mimeType: string; extension: string };
export type StickerSummary = { id: string; name: string; canDelete: boolean };
type Result<T = object> = ({ success: true } & T) | { success: false; error: string };

const uploadDir = () => process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

/**
 * Identifies an image from its first bytes, ignoring the file name and the browser's claim.
 * SVG is deliberately absent: it can carry scripts.
 */
export function detectImageType(bytes: Uint8Array): ImageType | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
  const isPng = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte);
  if (isPng) return { mimeType: "image/png", extension: "png" };
  if (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a") return { mimeType: "image/gif", extension: "gif" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { mimeType: "image/webp", extension: "webp" };
  return null;
}

/** A readable sticker name from an uploaded file name. */
export function stickerNameFromFile(fileName: string): string {
  const stem = fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  return stem.slice(0, NAME_MAX_LENGTH).trim() || "Sticker";
}

/** Anyone can remove their own sticker; owners and core members can remove any. */
function canDelete(sticker: { uploadedById: string | null }, userId: string, role: Parameters<typeof canManageInvites>[0]) {
  return sticker.uploadedById === userId || canManageInvites(role);
}

export async function listStickers(input: {
  workspaceId: string;
  userId: string;
  role: Parameters<typeof canManageInvites>[0];
}): Promise<StickerSummary[]> {
  const stickers = await prisma.sticker.findMany({
    where: { workspaceId: input.workspaceId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, uploadedById: true },
  });
  return stickers.map((sticker) => ({
    id: sticker.id,
    name: sticker.name,
    canDelete: canDelete(sticker, input.userId, input.role),
  }));
}

export async function createSticker(input: {
  workspaceId: string;
  userId: string;
  fileName: string;
  bytes: Uint8Array;
}): Promise<Result<{ sticker: { id: string; name: string } }>> {
  if (input.bytes.length === 0) return { success: false, error: "That file is empty." };
  if (input.bytes.length > STICKER_MAX_BYTES) return { success: false, error: "Stickers can be up to 2 MB." };

  const type = detectImageType(input.bytes);
  if (!type) return { success: false, error: "Use a PNG, GIF or WebP image." };

  const count = await prisma.sticker.count({ where: { workspaceId: input.workspaceId } });
  if (count >= STICKER_MAX_PER_WORKSPACE) {
    return { success: false, error: `This workspace has reached its limit of ${STICKER_MAX_PER_WORKSPACE} stickers.` };
  }

  // The stored name is random, so nothing from the upload ever reaches the file system.
  const storageKey = `${crypto.randomBytes(16).toString("hex")}.${type.extension}`;
  await mkdir(uploadDir(), { recursive: true });
  await writeFile(path.join(uploadDir(), storageKey), input.bytes);

  try {
    const sticker = await prisma.sticker.create({
      data: {
        name: stickerNameFromFile(input.fileName),
        storageKey,
        mimeType: type.mimeType,
        workspaceId: input.workspaceId,
        uploadedById: input.userId,
      },
      select: { id: true, name: true },
    });
    return { success: true, sticker };
  } catch (err) {
    await unlink(path.join(uploadDir(), storageKey)).catch(() => {});
    console.error("[createSticker] Failed:", err);
    return { success: false, error: "Couldn't save that sticker." };
  }
}

/** Sent stickers stay in chat history as their name once the image is gone. */
export async function deleteSticker(input: { stickerId: string; userId: string }): Promise<boolean> {
  const sticker = await prisma.sticker.findUnique({
    where: { id: input.stickerId },
    select: { id: true, storageKey: true, uploadedById: true, workspaceId: true },
  });
  if (!sticker) return false;

  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId: input.userId, workspaceId: sticker.workspaceId } },
    select: { role: true },
  });
  if (!membership || !canDelete(sticker, input.userId, membership.role)) return false;

  await prisma.sticker.delete({ where: { id: sticker.id } });
  await unlink(path.join(uploadDir(), sticker.storageKey)).catch(() => {});
  return true;
}

/** The image bytes, for members of the sticker's workspace only. */
export async function readSticker(stickerId: string, userId: string) {
  const sticker = await prisma.sticker.findUnique({
    where: { id: stickerId },
    select: { storageKey: true, mimeType: true, workspaceId: true },
  });
  if (!sticker) return null;

  const membership = await prisma.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: sticker.workspaceId } },
    select: { id: true },
  });
  if (!membership) return null;

  const bytes = await readFile(path.join(uploadDir(), sticker.storageKey)).catch(() => null);
  return bytes ? { bytes, mimeType: sticker.mimeType } : null;
}
