import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <Link href="/" className="brand" style={{ padding: 0, justifyContent: "center" }}>
            <span>⚡</span>
            <strong>Toguz</strong>
          </Link>
          <span className="auth-badge">Anti-Bitrix Startup Hub</span>
        </div>
        {children}
      </div>
    </div>
  );
}

