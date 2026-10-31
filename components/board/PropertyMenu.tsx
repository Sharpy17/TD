"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type MenuOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
  hint?: string;
};

/**
 * A details-panel property that opens a small menu in place: click the value, pick, done.
 * Arrow keys move through options, Escape closes without bubbling up to the board.
 */
export function PropertyMenu<T extends string>({
  label,
  display,
  options,
  selected,
  disabled,
  emptyText,
  footer,
  onSelect,
}: {
  label: string;
  display: ReactNode;
  options: MenuOption<T>[];
  selected: T | null;
  disabled?: boolean;
  emptyText?: string;
  footer?: (close: () => void) => ReactNode;
  onSelect: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) {
      // Picking an option unmounts the focused item; hand focus back to the trigger, not <body>.
      if (document.activeElement === document.body) triggerRef.current?.focus();
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    // Focus the selected option (or the first) when the menu opens.
    const menu = rootRef.current?.querySelector<HTMLElement>("[role=menu]");
    (menu?.querySelector<HTMLElement>("[aria-checked=true]") ?? menu?.querySelector<HTMLElement>("[role=menuitemradio]"))?.focus();
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>("[role=menuitemradio]")];
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "ArrowDown" ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  return (
    <div className="board-prop" ref={rootRef}>
      <dt id={`${menuId}-label`}>{label}</dt>
      <dd>
        <button
          ref={triggerRef}
          type="button"
          className="board-prop__trigger"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          aria-labelledby={`${menuId}-label ${menuId}-value`}
          disabled={disabled}
          onClick={() => setOpen(!open)}
        >
          <span id={`${menuId}-value`} className="board-prop__value">
            {display}
          </span>
          <span className="board-prop__chevron" aria-hidden="true">
            ▾
          </span>
        </button>
        {open && (
          <div className="board-menu" id={menuId} role="menu" aria-label={label} onKeyDown={onMenuKeyDown}>
            {options.length === 0 && emptyText && <p className="board-menu__empty">{emptyText}</p>}
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={option.value === selected}
                className="board-menu__item"
                onClick={() => {
                  if (option.value !== selected) onSelect(option.value);
                  close();
                }}
              >
                {option.icon}
                <span>{option.label}</span>
                {option.hint && <span className="board-menu__hint board-mono">{option.hint}</span>}
                {option.value === selected && (
                  <span className="board-menu__check" aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            ))}
            {footer && <div className="board-menu__footer">{footer(close)}</div>}
          </div>
        )}
      </dd>
    </div>
  );
}
