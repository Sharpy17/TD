import { GlobalSidebar } from "@/components/navigation/GlobalSidebar";
import { getSidebarAccount } from "@/lib/auth/account";

export default async function MainWorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const account = await getSidebarAccount();

  return (
    <main className="app-shell">
      <GlobalSidebar account={account} />
      <div className="workspace main-workspace">{children}</div>
    </main>
  );
}
