import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/service";
import { getOrCreateDirectChannel } from "@/lib/chat/direct";
import { getActiveMembership } from "@/lib/workspaces/service";

export const dynamic = "force-dynamic";

/** Opens (creating on first use) the private conversation with a teammate. */
export default async function DirectMessagePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const user = await getCurrentUser();
  const membership = user ? await getActiveMembership(user.id) : null;
  if (!user || !membership) notFound();

  const channelId = await getOrCreateDirectChannel({
    workspaceId: membership.workspaceId,
    userId: user.id,
    otherUserId: userId,
  });
  if (!channelId) notFound();
  redirect(`/chats/${channelId}`);
}
