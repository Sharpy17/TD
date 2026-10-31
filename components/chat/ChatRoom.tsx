"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { sendMessageAction, toggleReactionAction } from "@/app/(main)/chats/actions";
import { MAX_MESSAGE_LENGTH, QUICK_REACTIONS, type ChannelSummary, type ChatMessage } from "@/lib/chat/types";
import type { BoardEvent } from "@/lib/realtime/hub";
import type { UserSummary } from "@/lib/domain/types";
import { MessageContent } from "./MessageContent";

const GROUP_WINDOW_MS = 5 * 60 * 1000;
const NEAR_BOTTOM_PX = 120;

type Pending = { tempId: string; content: string; createdAt: string };

export type ChatRoomContext = {
  /** e.g. "Workspace" or the project name. */
  scopeLabel: string;
  scopeHref?: string;
  /** Module channels link to their board. */
  boardHref?: string;
};

function describe(channel: ChannelSummary, scopeLabel: string) {
  if (channel.kind === "workspace") return "Team-wide announcements, wins and async standups.";
  if (channel.kind === "project") return `Anything that spans ${scopeLabel}'s modules.`;
  return `Everything about ${channel.moduleName ?? "this module"}. Task comments land here too.`;
}

const dayKey = (iso: string) => new Date(iso).toDateString();
const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function toggleLocal(message: ChatMessage, emoji: string): ChatMessage {
  const existing = message.reactions.find((r) => r.emoji === emoji);
  let reactions;
  if (!existing) reactions = [...message.reactions, { emoji, count: 1, mine: true }];
  else if (existing.mine)
    reactions = message.reactions
      .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, mine: false } : r))
      .filter((r) => r.count > 0);
  else reactions = message.reactions.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1, mine: true } : r));
  return { ...message, reactions };
}

export function ChatRoom({
  channel,
  context,
  initialMessages,
  currentUser,
}: {
  channel: ChannelSummary;
  context: ChatRoomContext;
  initialMessages: ChatMessage[];
  currentUser: UserSummary;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [pending, setPending] = useState<Pending[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);

  const refetch = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/${encodeURIComponent(channel.id)}/messages`, { cache: "no-store" });
      if (response.ok) setMessages((await response.json()) as ChatMessage[]);
    } catch {
      // Offline: the next event or reconnect refetches.
    }
  }, [channel.id]);

  useEffect(() => {
    const source = new EventSource(`/api/chat/${encodeURIComponent(channel.id)}/events`);
    let opened = false;
    source.onopen = () => {
      setConnected(true);
      // Catch up on anything sent while we were disconnected.
      if (opened) void refetch();
      opened = true;
    };
    source.onerror = () => setConnected(false);
    source.onmessage = (message) => {
      const event = JSON.parse(message.data) as BoardEvent;
      if (event.type === "messages") void refetch();
    };
    return () => source.close();
  }, [channel.id, refetch]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (list && nearBottom.current) list.scrollTop = list.scrollHeight;
  }, [messages, pending]);

  const onScroll = () => {
    const list = listRef.current;
    if (list) nearBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < NEAR_BOTTOM_PX;
  };

  const send = async () => {
    const content = draft.trim();
    if (!content) return;
    if (content.length > MAX_MESSAGE_LENGTH) {
      setError(`Messages are limited to ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }
    const tempId = `pending-${crypto.randomUUID()}`;
    setPending((items) => [...items, { tempId, content, createdAt: new Date().toISOString() }]);
    setDraft("");
    setError(null);
    nearBottom.current = true;

    const result = await sendMessageAction(channel.id, content);
    setPending((items) => items.filter((item) => item.tempId !== tempId));
    if (result.success) {
      const sent = result.message;
      setMessages((items) => (items.some((m) => m.id === sent.id) ? items : [...items, sent]));
    } else {
      setError(result.error);
      setDraft((current) => current || content);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send();
    }
  };

  const react = async (messageId: string, emoji: string) => {
    setMessages((items) => items.map((m) => (m.id === messageId ? toggleLocal(m, emoji) : m)));
    const result = await toggleReactionAction(messageId, emoji);
    if (!result.success) {
      setError(result.error ?? "Could not react.");
      void refetch();
    }
  };

  const rows = [
    ...messages.map((message) => ({ message, pending: false })),
    ...pending.map((item) => ({
      pending: true,
      message: {
        id: item.tempId,
        content: item.content,
        createdAt: item.createdAt,
        author: currentUser,
        task: null,
        reactions: [],
      } satisfies ChatMessage,
    })),
  ];

  return (
    <section className="chat-room" aria-label={`#${channel.name}`}>
      <header className="chat-header">
        <div className="chat-header__title">
          {context.scopeHref ? (
            <Link className="eyebrow chat-header__scope" href={context.scopeHref}>{context.scopeLabel}</Link>
          ) : (
            <span className="eyebrow">{context.scopeLabel}</span>
          )}
          <h1><span>#</span>{channel.name}</h1>
          <p>{describe(channel, context.scopeLabel)}</p>
        </div>
        <div className="chat-header__meta">
          {channel.progress !== undefined && (
            <span className="chat-pill" title={channel.kind === "module" ? "Module progress" : "Project progress"}>
              <i style={{ width: `${channel.progress}%` }} />
              {channel.progress}% done
            </span>
          )}
          {channel.burning ? <span className="chat-pill chat-pill--burning">🔥 {channel.burning} burning</span> : null}
          {context.boardHref && <Link className="chat-pill chat-pill--link" href={context.boardHref}>Open board →</Link>}
          <span className={`chat-live ${connected ? "chat-live--on" : ""}`} title={connected ? "Live" : "Reconnecting…"} />
        </div>
      </header>

      <div className="chat-messages" ref={listRef} onScroll={onScroll} aria-live="polite">
        {rows.length === 0 ? (
          <div className="chat-empty">
            <span>#</span>
            <strong>Welcome to #{channel.name}</strong>
            <p>{describe(channel, context.scopeLabel)} Say hi to get it started.</p>
          </div>
        ) : (
          rows.map(({ message, pending: isPending }, index) => {
            const previous = rows[index - 1]?.message;
            const newDay = !previous || dayKey(previous.createdAt) !== dayKey(message.createdAt);
            const compact =
              !newDay &&
              !!previous &&
              previous.author.id === message.author.id &&
              !message.task &&
              !previous.task &&
              Date.parse(message.createdAt) - Date.parse(previous.createdAt) < GROUP_WINDOW_MS;

            return (
              <div key={message.id}>
                {newDay && (
                  <div className="chat-day" suppressHydrationWarning>
                    <span suppressHydrationWarning>{dayLabel(message.createdAt)}</span>
                  </div>
                )}
                <article
                  className={`chat-message ${compact ? "chat-message--compact" : ""} ${isPending ? "chat-message--pending" : ""}`}
                >
                  {compact ? (
                    <span className="chat-message__gutter" suppressHydrationWarning>{timeLabel(message.createdAt)}</span>
                  ) : (
                    <span className="avatar chat-message__avatar">{message.author.initials}</span>
                  )}
                  <div className="chat-message__main">
                    {!compact && (
                      <div className="chat-message__head">
                        <strong>{message.author.name}</strong>
                        <time dateTime={message.createdAt} suppressHydrationWarning>{timeLabel(message.createdAt)}</time>
                        {message.task && (
                          <span className="chat-task-chip" title={message.task.title}>
                            commented on {message.task.code ?? "a task"} · {message.task.title}
                          </span>
                        )}
                      </div>
                    )}
                    <MessageContent content={message.content} />
                    {message.reactions.length > 0 && (
                      <div className="chat-reactions">
                        {message.reactions.map((reaction) => (
                          <button
                            type="button"
                            key={reaction.emoji}
                            className={`chat-reaction ${reaction.mine ? "chat-reaction--mine" : ""}`}
                            onClick={() => react(message.id, reaction.emoji)}
                            aria-pressed={reaction.mine}
                          >
                            {reaction.emoji} {reaction.count}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {!isPending && (
                    <div className="chat-message__actions" role="toolbar" aria-label="React">
                      {QUICK_REACTIONS.map((emoji) => (
                        <button type="button" key={emoji} onClick={() => react(message.id, emoji)} aria-label={`React ${emoji}`}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              </div>
            );
          })
        )}
      </div>

      <form
        className="chat-composer"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        {error && <p className="chat-composer__error" role="alert">{error}</p>}
        <div className="chat-composer__box">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={`Message #${channel.name}`}
            aria-label={`Message #${channel.name}`}
            rows={1}
            maxLength={MAX_MESSAGE_LENGTH}
          />
          <button type="submit" className="primary-button" disabled={!draft.trim()}>Send</button>
        </div>
        <small>
          <kbd>Enter</kbd> to send · <kbd>Shift</kbd>+<kbd>Enter</kbd> for a new line · <code>`code`</code>, <code>```blocks```</code>, <strong>**bold**</strong>
        </small>
      </form>
    </section>
  );
}
