export const WORKSPACE_CHANNEL_NAME = "general";
export const PROJECT_CHANNEL_NAME = "general";

/** "Auth & Users" → "mod-auth-users". Shown as #mod-auth-users under its project. */
export function moduleChannelName(moduleName: string): string {
  const slug = moduleName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `mod-${slug || "module"}`;
}

/** Stable ids make the general channels idempotent to create, even from concurrent requests. */
export const workspaceChannelId = (workspaceId: string) => `ws-general-${workspaceId}`;
export const projectChannelId = (projectId: string) => `project-general-${projectId}`;
