import { getCurrentUser } from "@/lib/auth/service";
import { STICKER_MAX_BYTES, createSticker, listStickers } from "@/lib/stickers/service";
import { getActiveMembership } from "@/lib/workspaces/service";

/** A little room above the file limit for the multipart wrapping. */
const MAX_REQUEST_BYTES = STICKER_MAX_BYTES + 64 * 1024;

async function viewer() {
  const user = await getCurrentUser();
  const membership = user ? await getActiveMembership(user.id) : null;
  return user && membership ? { user, membership } : null;
}

/** The active workspace's sticker library. */
export async function GET() {
  const current = await viewer();
  if (!current) return Response.json({ error: "Not allowed." }, { status: 403 });
  const { user, membership } = current;

  return Response.json({
    stickers: await listStickers({ workspaceId: membership.workspaceId, userId: user.id, role: membership.role }),
    canUpload: membership.role !== "GUEST",
  });
}

export async function POST(request: Request) {
  const current = await viewer();
  if (!current || current.membership.role === "GUEST") {
    return Response.json({ error: "You can't add stickers to this workspace." }, { status: 403 });
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_REQUEST_BYTES) {
    return Response.json({ error: "Stickers can be up to 2 MB." }, { status: 413 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Choose an image to upload." }, { status: 400 });

  const result = await createSticker({
    workspaceId: current.membership.workspaceId,
    userId: current.user.id,
    fileName: file.name,
    bytes: new Uint8Array(await file.arrayBuffer()),
  });
  if (!result.success) return Response.json({ error: result.error }, { status: 400 });
  return Response.json({ sticker: { ...result.sticker, canDelete: true } }, { status: 201 });
}
