"use client";

import { EmojiPicker } from "frimousse";
import { ChatPopover } from "./ChatPopover";

/** Emoji data comes from this server, so opening the picker never calls a public CDN. */
const EMOJI_DATA_URL = "/emoji-data";

export function EmojiPopover({
  anchor,
  label,
  onPick,
  onClose,
}: {
  anchor: DOMRect;
  label: string;
  onPick: (emoji: string) => void;
  onClose: () => void;
}) {
  return (
    <ChatPopover anchor={anchor} label={label} onClose={onClose}>
      <EmojiPicker.Root
        className="emoji-picker"
        columns={8}
        emojibaseUrl={EMOJI_DATA_URL}
        onEmojiSelect={({ emoji }) => onPick(emoji)}
      >
        <EmojiPicker.Search className="form-input emoji-picker__search" placeholder="Search emoji" autoFocus />
        <EmojiPicker.Viewport className="emoji-picker__viewport">
          <EmojiPicker.Loading className="emoji-picker__status">Loading…</EmojiPicker.Loading>
          <EmojiPicker.Empty className="emoji-picker__status">No emoji found</EmojiPicker.Empty>
          <EmojiPicker.List className="emoji-picker__list" />
        </EmojiPicker.Viewport>
      </EmojiPicker.Root>
    </ChatPopover>
  );
}
