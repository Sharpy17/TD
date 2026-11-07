import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { prisma } from "../lib/prisma";
import { isSingleEmoji } from "../lib/chat/emoji";
import { createMessage, createStickerMessage, getMessages, toggleReaction } from "../lib/chat/service";
import { workspaceChannelId } from "../lib/chat/names";
import {
  STICKER_MAX_BYTES,
  createSticker,
  deleteSticker,
  detectImageType,
  listStickers,
  readSticker,
  stickerNameFromFile,
} from "../lib/stickers/service";
import { syncWorkspaceChannels } from "../lib/chat/service";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const GIF = new TextEncoder().encode("GIF89a-rest");
const WEBP = new TextEncoder().encode("RIFF1234WEBPVP8 ");
const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

describe("isSingleEmoji", () => {
  it("accepts one emoji of any kind", () => {
    for (const emoji of ["🔥", "🦄", "👍🏽", "👩‍💻", "🇰🇬", "1️⃣", "❤️"]) expect(isSingleEmoji(emoji)).toBe(true);
  });

  it("rejects text, several emoji and empty values", () => {
    for (const value of ["", "a", "hello", "🔥🔥", "🔥 ", "<img>", "x".repeat(40)]) expect(isSingleEmoji(value)).toBe(false);
  });
});

describe("detectImageType", () => {
  it("recognises the allowed formats from their bytes", () => {
    expect(detectImageType(PNG)?.mimeType).toBe("image/png");
    expect(detectImageType(GIF)?.mimeType).toBe("image/gif");
    expect(detectImageType(WEBP)?.mimeType).toBe("image/webp");
  });

  it("refuses SVG and anything else, whatever the file is called", () => {
    expect(detectImageType(SVG)).toBeNull();
    expect(detectImageType(new TextEncoder().encode("<html>"))).toBeNull();
  });
});

describe("stickerNameFromFile", () => {
  it("makes a readable name", () => {
    expect(stickerNameFromFile("this_is-fine.png")).toBe("this is fine");
    expect(stickerNameFromFile(".png")).toBe("Sticker");
    expect(stickerNameFromFile(`${"a".repeat(60)}.gif`)).toHaveLength(40);
  });
});

describe("Stickers (lib/stickers/service)", () => {
  const suffix = randomUUID();
  const ids = { owner: "", member: "", other: "", outsider: "" };
  let workspaceId: string;
  let otherWorkspaceId: string;
  let channelId: string;
  let dir: string;
  const previousDir = process.env.UPLOAD_DIR;

  beforeAll(async () => {
    dir = mkdtempSync(path.join(tmpdir(), "daihub-stickers-"));
    process.env.UPLOAD_DIR = dir;
    workspaceId = (await prisma.workspace.create({ data: { name: "Stickers", slug: `stickers-${suffix}` } })).id;
    otherWorkspaceId = (await prisma.workspace.create({ data: { name: "Others", slug: `others-${suffix}` } })).id;
    for (const key of Object.keys(ids) as Array<keyof typeof ids>) {
      ids[key] = (await prisma.user.create({ data: { name: key, email: `${key}-${suffix}@example.test` } })).id;
    }
    await prisma.membership.createMany({
      data: [
        { userId: ids.owner, workspaceId, role: "OWNER" },
        { userId: ids.member, workspaceId, role: "MEMBER" },
        { userId: ids.other, workspaceId, role: "MEMBER" },
        { userId: ids.outsider, workspaceId: otherWorkspaceId, role: "OWNER" },
      ],
    });
    await syncWorkspaceChannels(workspaceId);
    channelId = workspaceChannelId(workspaceId);
  });

  afterAll(async () => {
    process.env.UPLOAD_DIR = previousDir;
    await prisma.workspace.deleteMany({ where: { id: { in: [workspaceId, otherWorkspaceId] } } });
    await prisma.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
    rmSync(dir, { recursive: true, force: true });
  });

  const add = async (bytes: Uint8Array = PNG, fileName = "party.png", userId = ids.member) => {
    const result = await createSticker({ workspaceId, userId, fileName, bytes });
    if (!result.success) throw new Error(result.error);
    return result.sticker;
  };

  it("refuses bad uploads without storing anything", async () => {
    const before = readdirSync(dir).length;
    const upload = (bytes: Uint8Array) => createSticker({ workspaceId, userId: ids.member, fileName: "evil.png", bytes });

    expect(await upload(SVG)).toMatchObject({ success: false });
    expect(await upload(new Uint8Array())).toMatchObject({ success: false });
    expect(await upload(new Uint8Array(STICKER_MAX_BYTES + 1).fill(0x41))).toMatchObject({ success: false });
    expect(readdirSync(dir).length).toBe(before);
  });

  it("stores files under a random name, never the uploaded one", async () => {
    const sticker = await add(PNG, "../../etc/passwd.png");
    const row = await prisma.sticker.findUniqueOrThrow({ where: { id: sticker.id } });
    expect(row.storageKey).toMatch(/^[0-9a-f]{32}\.png$/);
    expect(readdirSync(dir)).toContain(row.storageKey);
  });

  it("serves images to workspace members only", async () => {
    const sticker = await add(GIF, "wave.gif");
    expect((await readSticker(sticker.id, ids.other))?.mimeType).toBe("image/gif");
    expect(await readSticker(sticker.id, ids.outsider)).toBeNull();
    expect(await readSticker("missing", ids.member)).toBeNull();
  });

  it("limits deletion to the uploader and workspace managers", async () => {
    const sticker = await add();
    const list = (userId: string, role: "OWNER" | "MEMBER") => listStickers({ workspaceId, userId, role });

    expect((await list(ids.member, "MEMBER")).find((s) => s.id === sticker.id)?.canDelete).toBe(true);
    expect((await list(ids.other, "MEMBER")).find((s) => s.id === sticker.id)?.canDelete).toBe(false);
    expect((await list(ids.owner, "OWNER")).find((s) => s.id === sticker.id)?.canDelete).toBe(true);

    expect(await deleteSticker({ stickerId: sticker.id, userId: ids.other })).toBe(false);
    expect(await deleteSticker({ stickerId: sticker.id, userId: ids.outsider })).toBe(false);
    expect(await deleteSticker({ stickerId: sticker.id, userId: ids.owner })).toBe(true);
  });

  it("sends a sticker and keeps its name in history after deletion", async () => {
    const sticker = await add(PNG, "ship it.png");
    const sent = await createStickerMessage({ channelId, authorId: ids.member, stickerId: sticker.id });
    expect(sent.success && sent.message.sticker).toEqual({ id: sticker.id, name: "ship it" });

    await deleteSticker({ stickerId: sticker.id, userId: ids.member });
    const last = (await getMessages(channelId, ids.member)).at(-1);
    expect(last?.sticker).toBeNull();
    expect(last?.content).toContain("ship it");
  });

  it("won't send another workspace's sticker or post where you have no access", async () => {
    const foreign = await createSticker({ workspaceId: otherWorkspaceId, userId: ids.outsider, fileName: "x.png", bytes: PNG });
    if (!foreign.success) throw new Error(foreign.error);
    expect((await createStickerMessage({ channelId, authorId: ids.member, stickerId: foreign.sticker.id })).success).toBe(false);

    const sticker = await add();
    expect((await createStickerMessage({ channelId, authorId: ids.outsider, stickerId: sticker.id })).success).toBe(false);
  });

  it("reacts with any emoji but rejects anything else", async () => {
    const created = await createMessage({ channelId, authorId: ids.member, content: "react to this" });
    if (!created.success) throw new Error(created.error);
    const messageId = created.message.id;

    expect((await toggleReaction({ messageId, userId: ids.member, emoji: "🦄" })).success).toBe(true);
    expect((await toggleReaction({ messageId, userId: ids.member, emoji: "👩‍💻" })).success).toBe(true);
    expect((await toggleReaction({ messageId, userId: ids.member, emoji: "not an emoji" })).success).toBe(false);
  });
});
