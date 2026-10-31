import type { NextRequest } from "next/server";
import { canonicalProjectId } from "@/lib/projects/service";
import { dropViewer, listViewers, subscribe, type BoardEvent } from "@/lib/realtime/hub";

const KEEPALIVE_MS = 25_000;

/** Server-sent events: task changes, comments and presence for one project's board. */
export async function GET(request: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  const projectId = canonicalProjectId((await ctx.params).projectId);
  const clientId = request.nextUrl.searchParams.get("clientId");
  const encoder = new TextEncoder();

  let cleanup = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: BoardEvent) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      const unsubscribe = subscribe(projectId, send);
      const keepalive = setInterval(() => controller.enqueue(encoder.encode(": keepalive\n\n")), KEEPALIVE_MS);

      send({ type: "presence", viewers: listViewers(projectId) });

      cleanup = () => {
        clearInterval(keepalive);
        unsubscribe();
        if (clientId) dropViewer(projectId, clientId);
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
