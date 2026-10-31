import { getCurrentUser } from "@/lib/auth/service";
import { ChatScreen, ChatSignInPrompt } from "@/components/chat/ChatScreen";

export const dynamic = "force-dynamic";

export default async function ChatChannelPage({ params }: { params: Promise<{ channelId: string }> }) {
  const { channelId } = await params;
  const user = await getCurrentUser();
  if (!user) return <ChatSignInPrompt />;

  return <ChatScreen user={user} channelId={channelId} scope={{ kind: "workspace" }} />;
}
