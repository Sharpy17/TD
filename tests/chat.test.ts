import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { createModule } from "../lib/modules/service";
import { addTaskComment, createTask } from "../lib/tasks/service";
import { moduleChannelName, projectChannelId, workspaceChannelId } from "../lib/chat/names";
import {
  canAccessChannel,
  createMessage,
  ensureModuleChannel,
  findChannel,
  getChatDirectory,
  getMessages,
  toggleReaction,
} from "../lib/chat/service";

describe("Text channels (lib/chat/service)", () => {
  const suffix = randomUUID();
  let workspaceId: string;
  let projectId: string;
  let authModuleId: string;
  let voiceModuleId: string;
  const ids = { member: "", guest: "", outsider: "" };

  beforeAll(async () => {
    const workspace = await prisma.workspace.create({ data: { name: "Chat test", slug: `chat-test-${suffix}` } });
    workspaceId = workspace.id;
    for (const key of Object.keys(ids) as Array<keyof typeof ids>) {
      const user = await prisma.user.create({ data: { name: `${key} user`, email: `${key}-${suffix}@example.test` } });
      ids[key] = user.id;
      if (key !== "outsider") {
        await prisma.membership.create({ data: { userId: user.id, workspaceId, role: key === "guest" ? "GUEST" : "MEMBER" } });
      }
    }
    const project = await prisma.project.create({ data: { name: "Chat project", workspaceId } });
    projectId = project.id;
    authModuleId = (await createModule({ projectId, name: "Auth & Users" })).moduleId!;
    voiceModuleId = (await createModule({ projectId, name: "Voice Engine" })).moduleId!;
    await prisma.module.update({ where: { id: voiceModuleId }, data: { assignees: { connect: { id: ids.guest } } } });
  });

  afterAll(async () => {
    if (workspaceId) await prisma.workspace.delete({ where: { id: workspaceId } });
    await prisma.user.deleteMany({ where: { id: { in: Object.values(ids).filter(Boolean) } } });
  });

  it("names module channels after the module", () => {
    expect(moduleChannelName("Auth & Users")).toBe("mod-auth-users");
    expect(moduleChannelName("  WebRTC!! ")).toBe("mod-webrtc");
    expect(moduleChannelName("!!!")).toBe("mod-module");
  });

  it("gives members the workspace #general, then each project's #general and module channels", async () => {
    const directory = await getChatDirectory(ids.member);
    expect(directory.workspace.map((c) => c.id)).toEqual([workspaceChannelId(workspaceId)]);
    expect(directory.projects).toHaveLength(1);

    const [group] = directory.projects;
    expect(group.id).toBe(projectId);
    expect(group.channels.map((c) => [c.kind, c.name])).toEqual([
      ["project", "general"],
      ["module", "mod-auth-users"],
      ["module", "mod-voice-engine"],
    ]);
    expect(group.channels[0].id).toBe(projectChannelId(projectId));
    expect(group.channels[1].moduleId).toBe(authModuleId);
  });

  it("is idempotent and follows module renames", async () => {
    await getChatDirectory(ids.member);
    await prisma.module.update({ where: { id: authModuleId }, data: { name: "Identity" } });
    const directory = await getChatDirectory(ids.member);
    expect(await prisma.channel.count({ where: { workspaceId } })).toBe(4);
    expect(directory.projects[0].channels[1].name).toBe("mod-identity");
  });

  it("shows guests only the module channels they are assigned to", async () => {
    const directory = await getChatDirectory(ids.guest);
    expect(directory.workspace).toEqual([]);
    expect(directory.projects[0].channels.map((c) => c.moduleId)).toEqual([voiceModuleId]);

    const authChannel = (await ensureModuleChannel(authModuleId))!;
    const voiceChannel = (await ensureModuleChannel(voiceModuleId))!;
    expect(await canAccessChannel(voiceChannel, ids.guest)).toBe(true);
    expect(await canAccessChannel(authChannel, ids.guest)).toBe(false);
    expect(await canAccessChannel(projectChannelId(projectId), ids.guest)).toBe(false);
  });

  it("keeps outsiders out", async () => {
    expect(await getChatDirectory(ids.outsider)).toEqual({ workspace: [], projects: [], people: [] });
    const result = await createMessage({ channelId: projectChannelId(projectId), authorId: ids.outsider, content: "hi" });
    expect(result.success).toBe(false);
  });

  it("posts, validates and lists messages oldest first", async () => {
    const channelId = projectChannelId(projectId);
    expect((await createMessage({ channelId, authorId: ids.member, content: "   " })).success).toBe(false);
    expect((await createMessage({ channelId, authorId: ids.member, content: "x".repeat(4001) })).success).toBe(false);

    const first = await createMessage({ channelId, authorId: ids.member, content: "  first  " });
    const second = await createMessage({ channelId, authorId: ids.member, content: "second" });
    expect(first.success && second.success).toBe(true);
    if (first.success) expect(first.message.content).toBe("first");

    const messages = await getMessages(channelId, ids.member);
    expect(messages.map((m) => m.content)).toEqual(["first", "second"]);
    expect(messages[0].author.initials).toBe("ME");
  });

  it("toggles reactions per user and rejects unknown emoji", async () => {
    const channelId = projectChannelId(projectId);
    const [message] = await getMessages(channelId, ids.member);

    expect((await toggleReaction({ messageId: message.id, userId: ids.member, emoji: "not an emoji" })).success).toBe(false);
    const on = await toggleReaction({ messageId: message.id, userId: ids.member, emoji: "🔥" });
    expect(on.success && on.active).toBe(true);
    expect((await getMessages(channelId, ids.member))[0].reactions).toEqual([{ emoji: "🔥", count: 1, mine: true }]);
    expect((await getMessages(channelId, ids.guest))[0].reactions).toEqual([{ emoji: "🔥", count: 1, mine: false }]);

    const off = await toggleReaction({ messageId: message.id, userId: ids.member, emoji: "🔥" });
    expect(off.success && !off.active).toBe(true);
    expect((await getMessages(channelId, ids.member))[0].reactions).toEqual([]);
  });

  it("puts task comments in the module channel, tagged with the task", async () => {
    const task = await createTask({ moduleId: voiceModuleId, title: "Fix echo" });
    expect(task.success).toBe(true);
    const comment = await addTaskComment({ taskId: task.taskId!, authorId: ids.member, content: "Repro on Safari" });
    expect(comment.success).toBe(true);
    expect(comment.channelId).toBe(await ensureModuleChannel(voiceModuleId));

    const messages = await getMessages(comment.channelId!, ids.member);
    expect(messages.at(-1)?.task?.title).toBe("Fix echo");
    expect(messages.at(-1)?.task?.code).toMatch(/^VOI-\d+$/);
  });

  it("finds channels in a directory", async () => {
    const directory = await getChatDirectory(ids.member);
    expect(findChannel(directory, workspaceChannelId(workspaceId))?.project).toBeNull();
    expect(findChannel(directory, projectChannelId(projectId))?.project?.id).toBe(projectId);
    expect(findChannel(directory, "nope")).toBeNull();
  });
});
