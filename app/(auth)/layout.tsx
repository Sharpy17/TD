import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <Link href="/" className="auth-brand">
          <span className="brand__mark" aria-hidden="true" />
          DaiHub
        </Link>
        {children}
      </div>
    </div>
  );
}
