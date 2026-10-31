"use client";

import { useState, type ReactNode } from "react";

/*
 * A deliberately small Markdown subset, rendered as React nodes (never raw HTML):
 * ```lang fenced code blocks``` with a copy button, `inline code`, **bold**, and http(s) links.
 */

type Block = { kind: "text"; text: string } | { kind: "code"; lang: string; code: string };

function splitBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  const fence = /```([\w+-]*)[^\S\n]*\n?([\s\S]*?)```/g;
  let last = 0;
  for (const match of content.matchAll(fence)) {
    const index = match.index ?? 0;
    if (index > last) blocks.push({ kind: "text", text: content.slice(last, index) });
    blocks.push({ kind: "code", lang: match[1] ?? "", code: (match[2] ?? "").replace(/\n$/, "") });
    last = index + match[0].length;
  }
  if (last < content.length) blocks.push({ kind: "text", text: content.slice(last) });
  return blocks;
}

const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(https?:\/\/[^\s<>()]+[^\s<>().,!?;:'"])/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    const key = `${keyPrefix}-${index}`;
    const [token] = match;
    if (match[1]) nodes.push(<code key={key} className="chat-inline-code">{token.slice(1, -1)}</code>);
    else if (match[2]) nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    else nodes.push(<a key={key} href={token} target="_blank" rel="noreferrer noopener">{token}</a>);
    last = index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(code).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      },
      () => {},
    );
  };

  return (
    <div className="chat-code">
      <div className="chat-code__bar">
        <span>{lang || "code"}</span>
        <button type="button" onClick={copy}>{copied ? "Copied" : "Copy"}</button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  );
}

export function MessageContent({ content }: { content: string }) {
  return (
    <div className="chat-message__body">
      {splitBlocks(content).map((block, i) =>
        block.kind === "code" ? (
          <CodeBlock key={i} lang={block.lang} code={block.code} />
        ) : block.text.trim() ? (
          <p key={i}>{renderInline(block.text.replace(/^\n+|\n+$/g, ""), String(i))}</p>
        ) : null,
      )}
    </div>
  );
}
