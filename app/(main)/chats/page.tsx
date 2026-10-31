import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/service";
import { getChatDirectory } from "@/lib/chat/service";
import { ChatNoAccess, ChatSignInPrompt } from "@/components/chat/ChatScreen";

export const dynamic = "force-dynamic";

/** /chats opens the workspace #general (or the first channel a guest can see). */
export default async function ChatsPage() {
  const user = await getCurrentUser();
  if (!user) return <ChatSignInPrompt />;

  const directory = await getChatDirectory(user.id);
  const first = directory.workspace[0] ?? directory.projects[0]?.channels[0];
  if (!first) return <ChatNoAccess />;
  redirect(`/chats/${first.id}`);
}
