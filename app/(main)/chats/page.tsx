export default function ChatsPage() {
  return (
    <div className="route-enter">
      <header className="main-topbar">
        <div><span className="eyebrow">Workspace</span><strong>Chats</strong></div>
      </header>
      <div className="main-content">
        <section className="page-heading">
          <span className="eyebrow">Team conversations</span>
          <h1>Chats will live here.</h1>
          <p>This is only the navigation destination for now. We&apos;ll design chat behavior as its own feature.</p>
        </section>
        <div className="empty-state"><span>#</span><strong>No conversations yet</strong><p>Workspace and project chats will be separated clearly when we build this feature.</p></div>
      </div>
    </div>
  );
}
