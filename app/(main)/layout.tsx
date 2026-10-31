import { GlobalSidebar } from "@/components/navigation/GlobalSidebar";

export default function MainWorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="app-shell">
      <GlobalSidebar />
      <div className="workspace main-workspace">{children}</div>
    </main>
  );
}
