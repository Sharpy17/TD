"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthActionState } from "@/app/(auth)/actions";

const initialState: AuthActionState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800 }}>Welcome back</h1>
        <p style={{ margin: 0, color: "var(--secondary)", fontSize: 13 }}>
          Log in to your startup workspace
        </p>
      </div>

      {state?.error && (
        <div className="auth-banner-error" role="alert" style={{ marginBottom: 18 }}>
          <span>⚠️</span>
          <span>{state.error}</span>
        </div>
      )}

      <form action={formAction} className="auth-form" noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="alex@startup.io"
            className={`form-input ${state?.fieldErrors?.email ? "form-input--error" : ""}`}
            disabled={isPending}
          />
          {state?.fieldErrors?.email && (
            <span className="form-error">{state.fieldErrors.email}</span>
          )}
        </div>

        <div className="form-group">
          <div className="form-label">
            <label htmlFor="password">Password</label>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••••••"
            className={`form-input ${state?.fieldErrors?.password ? "form-input--error" : ""}`}
            disabled={isPending}
          />
          {state?.fieldErrors?.password && (
            <span className="form-error">{state.fieldErrors.password}</span>
          )}
        </div>

        <button type="submit" className="auth-submit" disabled={isPending}>
          {isPending ? (
            <>
              <span>⚡</span> Signing in...
            </>
          ) : (
            "Sign In →"
          )}
        </button>
      </form>

      <div className="auth-footer">
        Don&apos;t have an account?
        <Link href="/signup">Create a workspace</Link>
      </div>
    </div>
  );
}

