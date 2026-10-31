"use server";

import { redirect } from "next/navigation";
import { authenticateWithPassword, registerUser, logout } from "@/lib/auth/service";
import { LoginSchema, SignUpSchema } from "@/lib/auth/validations";

export interface AuthActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

export async function loginAction(
  _prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() || "form";
      fieldErrors[field] = issue.message;
    }
    return { fieldErrors, error: "Please check your credentials and try again." };
  }

  const result = await authenticateWithPassword(parsed.data);
  if (!result.success) {
    return { error: result.error || "Authentication failed." };
  }

  redirect("/");
}

export async function signupAction(
  _prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    workspaceName: formData.get("workspaceName") || undefined,
  };

  const parsed = SignUpSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]?.toString() || "form";
      fieldErrors[field] = issue.message;
    }
    return { fieldErrors, error: "Please provide valid registration details." };
  }

  const result = await registerUser(parsed.data);
  if (!result.success) {
    return { error: result.error || "Sign up failed." };
  }

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect("/login");
}

