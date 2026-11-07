import { getCurrentUser } from "@/lib/auth/service";
import { deleteSticker, readSticker } from "@/lib/stickers/service";

type Context = { params: Promise<{ stickerId: string }> };

/** Serves a sticker to workspace members, with headers that stop it being treated as anything but an image. */
export async function GET(_request: Request, ctx: Context) {
  const user = await getCurrentUser();
  const sticker = user ? await readSticker((await ctx.params).stickerId, user.id) : null;
  if (!sticker) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(sticker.bytes), {
    headers: {
      "Content-Type": sticker.mimeType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}

export async function DELETE(_request: Request, ctx: Context) {
  const user = await getCurrentUser();
  if (!user) return new Response(null, { status: 401 });
  const deleted = await deleteSticker({ stickerId: (await ctx.params).stickerId, userId: user.id });
  return new Response(null, { status: deleted ? 204 : 403 });
}
