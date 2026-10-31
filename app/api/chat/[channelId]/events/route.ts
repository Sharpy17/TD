import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/service";
import { canAccessChannel } from "@/lib/chat/service";
import { chatTopic, subscribe, type BoardEvent } from "@/lib/realtime/hub";

const KEEPALIVE_MS = 25_000;

/** Server-sent events for one chat channel: tells open clients to refetch when messages or reactions change. */
export async function GET(request: NextRequest, ctx: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await ctx.params;
  const user = await getCurrentUser();
  if (!user || !(await canAccessChannel(channelId, user.id))) {
    return Response.json({ error: "Not allowed." }, { status: 403 });
  }

  const encoder = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: BoardEvent) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      const unsubscribe = subscribe(chatTopic(channelId), send);
      const keepalive = setInterval(() => controller.enqueue(encoder.encode(": keepalive\n\n")), KEEPALIVE_MS);

      cleanup = () => {
        clearInterval(keepalive);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed by the runtime.
        }
      };
      request.signal.addEventListener("abort", () => cleanup(), { once: true });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
