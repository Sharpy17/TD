"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import type { StickerSummary } from "@/lib/stickers/service";
import { ChatPopover } from "./ChatPopover";

const ACCEPTED_TYPES = "image/png,image/gif,image/webp";

/** The workspace's stickers: click one to send it, or add your own. */
export function StickerPopover({
  anchor,
  onPick,
  onClose,
}: {
  anchor: DOMRect;
  onPick: (sticker: StickerSummary) => void;
  onClose: () => void;
}) {
  const [stickers, setStickers] = useState<StickerSummary[] | null>(null);
  const [canUpload, setCanUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stickers", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("load"))))
      .then((data: { stickers: StickerSummary[]; canUpload: boolean }) => {
        if (cancelled) return;
        setStickers(data.stickers);
        setCanUpload(data.canUpload);
      })
      .catch(() => {
        if (cancelled) return;
        setStickers([]);
        setError("Couldn't load stickers.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    for (const file of files) {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/stickers", { method: "POST", body }).catch(() => null);
      const data = (await response?.json().catch(() => null)) as { sticker?: StickerSummary; error?: string } | null;
      const added = data?.sticker;
      if (response?.ok && added) setStickers((items) => [added, ...(items ?? [])]);
      else setError(data?.error ?? "Couldn't upload that sticker.");
    }
    setUploading(false);
  };

  const remove = async (sticker: StickerSummary) => {
    const response = await fetch(`/api/stickers/${encodeURIComponent(sticker.id)}`, { method: "DELETE" }).catch(() => null);
    if (response?.ok) setStickers((items) => (items ?? []).filter((item) => item.id !== sticker.id));
    else setError("Couldn't delete that sticker.");
  };

  return (
    <ChatPopover anchor={anchor} label="Stickers" onClose={onClose}>
      <div className="sticker-panel">
        <div className="sticker-panel__head">
          <strong>Stickers</strong>
          {canUpload && (
            <button type="button" className="secondary-button" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Icon name="plus" size={14} /> {uploading ? "Uploading…" : "Add"}
            </button>
          )}
          <input ref={fileRef} type="file" accept={ACCEPTED_TYPES} multiple hidden onChange={upload} aria-label="Upload stickers" />
        </div>

        {error && <p className="sticker-panel__error" role="alert">{error}</p>}

        {stickers === null ? (
          <p className="sticker-panel__status">Loading…</p>
        ) : stickers.length === 0 ? (
          <p className="sticker-panel__status">
            {canUpload ? "No stickers yet. Add a PNG, GIF or WebP up to 2 MB." : "No stickers yet."}
          </p>
        ) : (
          <ul className="sticker-grid">
            {stickers.map((sticker) => (
              <li key={sticker.id}>
                <button type="button" className="sticker-grid__send" title={sticker.name} onClick={() => onPick(sticker)}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- served by our own authenticated route */}
                  <img src={`/api/stickers/${encodeURIComponent(sticker.id)}`} alt={sticker.name} loading="lazy" />
                </button>
                {sticker.canDelete && (
                  <button
                    type="button"
                    className="sticker-grid__delete"
                    aria-label={`Delete ${sticker.name}`}
                    title="Delete sticker"
                    onClick={() => remove(sticker)}
                  >
                    <Icon name="close" size={12} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </ChatPopover>
  );
}
