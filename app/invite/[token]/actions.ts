"use server";

import { redirect } from "next/navigation";
import { authenticateWithPassword, getCurrentUser, registerUser } from "@/lib/auth/service";
import { LoginSchema, SignUpSchema } from "@/lib/auth/validations";
import { acceptInvite, lookupInvite } from "@/lib/workspaces/service";

export interface InviteActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

const EXPIRED = "This invite link has expired or been revoked. Ask for a new one.";

function fieldErrorsFrom(issues: Array<{ path: PropertyKey[]; message: string }>) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) fieldErrors[issue.path[0]?.toString() || "form"] = issue.message;
  return fieldErrors;
}

/** Someone already signed in accepts the invite. */
export async function acceptInviteAction(_state: InviteActionState | null, formData: FormData): Promise<InviteActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in to accept this invite." };
  const joined = await acceptInvite(String(formData.get("token")), user.id);
  if (!joined) return { error: EXPIRED };
  redirect("/");
}

/** A new person creates their account directly inside the invited workspace. */
export async function inviteSignupAction(_state: InviteActionState | null, formData: FormData): Promise<InviteActionState> {
  const parsed = SignUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues), error: "Please check the details below." };
  }

  const invite = await lookupInvite(String(formData.get("token")));
  if (!invite) return { error: EXPIRED };

  const result = await registerUser(parsed.data, invite);
  if (!result.success) return { error: result.error || "Sign up failed." };
  redirect("/");
}

/** Someone with an account signs in here and joins in one step. */
export async function inviteLoginAction(_state: InviteActionState | null, formData: FormData): Promise<InviteActionState> {
  const parsed = LoginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues), error: "Please check your credentials and try again." };
  }

  const result = await authenticateWithPassword(parsed.data);
  if (!result.success || !result.user) return { error: result.error || "Authentication failed." };

  const joined = await acceptInvite(String(formData.get("token")), result.user.id);
  if (!joined) return { error: EXPIRED };
  redirect("/");
}
