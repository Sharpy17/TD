import { getCurrentUser } from "@/lib/auth/service";
import { getTotalDirectUnread } from "@/lib/chat/direct";
import { listVoiceMembers, subscribe, sweepVoice, userTopic, workspaceTopic, type BoardEvent } from "@/lib/realtime/hub";
import { getActiveMembership } from "@/lib/workspaces/service";

const KEEPALIVE_MS = 25_000;

/** One stream per signed-in tab: who is in which voice room, and the unread direct message count. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  const membership = user ? await getActiveMembership(user.id) : null;
  if (!user || !membership) return Response.json({ error: "Not allowed." }, { status: 403 });

  const { workspaceId } = membership;
  const unread = await getTotalDirectUnread(user.id, workspaceId);
  const encoder = new TextEncoder();

  let cleanup = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: BoardEvent) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      const unsubscribers = [subscribe(workspaceTopic(workspaceId), send), subscribe(userTopic(user.id), send)];
      const keepalive = setInterval(() => {
        controller.enqueue(encoder.encode(": keepalive\n\n"));
        sweepVoice(workspaceId);
      }, KEEPALIVE_MS);

      send({ type: "voice", members: listVoiceMembers(workspaceId) });
      send({ type: "unread", total: unread });

      cleanup = () => {
        clearInterval(keepalive);
        unsubscribers.forEach((unsubscribe) => unsubscribe());
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
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  });
}
