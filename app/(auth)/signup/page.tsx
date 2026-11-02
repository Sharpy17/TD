"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signupAction, type AuthActionState } from "@/app/(auth)/actions";
import { Icon } from "@/components/ui/Icon";

const initialState: AuthActionState = {};

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(signupAction, initialState);
  const [password, setPassword] = useState("");

  const hasMinLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return (
    <div>
      <div className="auth-header">
        <h1>Get started</h1>
        <p>
          Set up your team workspace in seconds
        </p>
      </div>

      {state?.error && (
        <div className="auth-banner-error auth-banner-error--spaced" role="alert">
          <Icon name="alert" />
          <span>{state.error}</span>
        </div>
      )}

      <form action={formAction} className="auth-form" noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="name">
            Your name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Alex Morgan"
            className={`form-input ${state?.fieldErrors?.name ? "form-input--error" : ""}`}
            disabled={isPending}
          />
          {state?.fieldErrors?.name && (
            <span className="form-error">{state.fieldErrors.name}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Work email
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
          <label className="form-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`form-input ${state?.fieldErrors?.password ? "form-input--error" : ""}`}
            disabled={isPending}
          />
          {state?.fieldErrors?.password && (
            <span className="form-error">{state.fieldErrors.password}</span>
          )}

          {password.length > 0 && (
            <div className="auth-checklist">
              <div
                className={`auth-check-item ${hasMinLength ? "auth-check-item--valid" : ""}`}
              >
                <span><Icon name={hasMinLength ? "check" : "dot"} size={14} /></span>
                <span>At least 8 characters</span>
              </div>
              <div
                className={`auth-check-item ${hasLetter ? "auth-check-item--valid" : ""}`}
              >
                <span><Icon name={hasLetter ? "check" : "dot"} size={14} /></span>
                <span>At least 1 letter</span>
              </div>
              <div
                className={`auth-check-item ${hasNumber ? "auth-check-item--valid" : ""}`}
              >
                <span><Icon name={hasNumber ? "check" : "dot"} size={14} /></span>
                <span>At least 1 number</span>
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="workspaceName">
            <span>Workspace name</span>
            <span className="optional">optional</span>
          </label>
          <input
            id="workspaceName"
            name="workspaceName"
            type="text"
            placeholder="e.g. Acme Studio"
            className={`form-input ${state?.fieldErrors?.workspaceName ? "form-input--error" : ""}`}
            disabled={isPending}
          />
          {state?.fieldErrors?.workspaceName && (
            <span className="form-error">{state.fieldErrors.workspaceName}</span>
          )}
        </div>

        <button type="submit" className="auth-submit" disabled={isPending}>
          {isPending ? (
            <>
              Creating workspace...
            </>
          ) : (
            "Create startup workspace"
          )}
        </button>
      </form>

      <div className="auth-footer">
        Already have an account?
        <Link href="/login">Sign in</Link>
      </div>
    </div>
  );
}

