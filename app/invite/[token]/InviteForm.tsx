"use client";

import { useActionState, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { acceptInviteAction, inviteLoginAction, inviteSignupAction, type InviteActionState } from "./actions";

const initialState: InviteActionState = {};

function Banner({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <div className="auth-banner-error auth-banner-error--spaced" role="alert">
      <Icon name="alert" />
      <span>{error}</span>
    </div>
  );
}

function Field({
  name,
  label,
  type,
  autoComplete,
  error,
  disabled,
}: {
  name: string;
  label: string;
  type: string;
  autoComplete: string;
  error?: string;
  disabled: boolean;
}) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className={`form-input ${error ? "form-input--error" : ""}`}
        disabled={disabled}
      />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

export function AcceptInvite({ token, userName }: { token: string; userName: string }) {
  const [state, action, pending] = useActionState(acceptInviteAction, initialState);
  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="token" value={token} />
      <Banner error={state?.error} />
      <button type="submit" className="auth-submit" disabled={pending}>
        {pending ? "Joining…" : `Join as ${userName}`}
      </button>
    </form>
  );
}

export function JoinWithAccount({ token }: { token: string }) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [signupState, signupAction, signingUp] = useActionState(inviteSignupAction, initialState);
  const [loginState, loginAction, loggingIn] = useActionState(inviteLoginAction, initialState);

  if (mode === "login") {
    return (
      <>
        <Banner error={loginState?.error} />
        <form action={loginAction} className="auth-form" noValidate>
          <input type="hidden" name="token" value={token} />
          <Field name="email" label="Email" type="email" autoComplete="email" error={loginState?.fieldErrors?.email} disabled={loggingIn} />
          <Field name="password" label="Password" type="password" autoComplete="current-password" error={loginState?.fieldErrors?.password} disabled={loggingIn} />
          <button type="submit" className="auth-submit" disabled={loggingIn}>{loggingIn ? "Joining…" : "Sign in and join"}</button>
        </form>
        <div className="auth-footer">
          New here?
          <button type="button" className="invite-switch" onClick={() => setMode("signup")}>Create an account</button>
        </div>
      </>
    );
  }

  return (
    <>
      <Banner error={signupState?.error} />
      <form action={signupAction} className="auth-form" noValidate>
        <input type="hidden" name="token" value={token} />
        <Field name="name" label="Your name" type="text" autoComplete="name" error={signupState?.fieldErrors?.name} disabled={signingUp} />
        <Field name="email" label="Email" type="email" autoComplete="email" error={signupState?.fieldErrors?.email} disabled={signingUp} />
        <Field name="password" label="Password" type="password" autoComplete="new-password" error={signupState?.fieldErrors?.password} disabled={signingUp} />
        <button type="submit" className="auth-submit" disabled={signingUp}>{signingUp ? "Joining…" : "Create account and join"}</button>
      </form>
      <div className="auth-footer">
        Already have an account?
        <button type="button" className="invite-switch" onClick={() => setMode("login")}>Sign in</button>
      </div>
    </>
  );
}
