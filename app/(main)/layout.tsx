import { GlobalSidebar } from "@/components/navigation/GlobalSidebar";
import { getSidebarAccount, getViewerWorkspace } from "@/lib/auth/account";
import { getVoiceRooms } from "@/lib/voice/service";

export default async function MainWorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const viewer = await getViewerWorkspace();
  const [account, rooms] = await Promise.all([getSidebarAccount(), getVoiceRooms(viewer?.workspaceId)]);

  return (
    <main className="app-shell">
      <GlobalSidebar account={account} rooms={rooms} />
      <div className="workspace main-workspace">{children}</div>
    </main>
  );
}
