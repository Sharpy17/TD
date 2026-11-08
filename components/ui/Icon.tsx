/** One stroke family for the whole app: 24px grid, 1.75 stroke, round caps. */
const paths = {
  home: <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" />,
  projects: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <path d="M3.5 9.5h17M9.5 9.5v10" />
    </>
  ),
  hash: <path d="M9 4 7 20M17 4l-2 16M4.5 9h16M3.5 15h16" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.4-4.4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" />,
  pencil: <path d="M14.5 5.5 18.5 9.5M4.5 19.5l1-4.5L16 4.5a1.4 1.4 0 0 1 2 0l1.5 1.5a1.4 1.4 0 0 1 0 2L9 18.5z" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronUp: <path d="m6 15 6-6 6 6" />,
  speaker: <path d="M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />,
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </>
  ),
  micOff: <path d="M9 9V6a3 3 0 0 1 5.8-1M15 10v1a3 3 0 0 1-4.6 2.5M5.5 11a6.5 6.5 0 0 0 10.8 4.9M18.5 11a6.4 6.4 0 0 1-.4 2.2M12 17.5V21M4 4l16 16" />,
  headphones: <path d="M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v5H5a1 1 0 0 1-1-1zM20 15h-3v5h2a1 1 0 0 0 1-1z" />,
  headphonesOff: <path d="M4 15v-3a8 8 0 0 1 12.5-6.6M20 12v3M4 15h3v5H5a1 1 0 0 1-1-1zM20 15h-3v5h2a1 1 0 0 0 1-1zM4 4l16 16" />,
  phoneOff: <path d="M4.5 13.5c4.4-4.2 10.6-4.2 15 0l-1.8 2.6-3.2-1.2v-2.4a9.5 9.5 0 0 0-5 0v2.4l-3.2 1.2z" />,
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M3 20a6 6 0 0 1 12 0M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14.2a6 6 0 0 1 3 5.8" />
    </>
  ),
  more: (
    <>
      <circle cx="6" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="18" cy="12" r="1" />
    </>
  ),
  board: <path d="M4.5 4.5h4v15h-4zM10 4.5h4v10h-4zM15.5 4.5h4v7h-4z" />,
  logout: <path d="M14 4.5h4.5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H14M10 8l-4 4 4 4M6 12h10" />,
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  alert: <path d="M12 4 21 19.5H3zM12 10v4.5M12 17.2v.3" />,
  code: <path d="m9 7-5 5 5 5M15 7l5 5-5 5" />,
  copy: (
    <>
      <rect x="8.5" y="8.5" width="11" height="11" rx="1.5" />
      <path d="M15.5 8.5V5.5a1 1 0 0 0-1-1h-9a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3" />
    </>
  ),
  smile: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M8.5 14a4.2 4.2 0 0 0 7 0M9.5 9.8v.2M14.5 9.8v.2" />
    </>
  ),
  sticker: <path d="M5.5 4h13A1.5 1.5 0 0 1 20 5.5V14l-6 6H5.5A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4zM14 20v-4.5a1.5 1.5 0 0 1 1.5-1.5H20M8.5 9.5v.2M13.5 9.5v.2" />,
  reply: <path d="M10 6 4 12l6 6M4 12h10a6 6 0 0 1 6 6" />,
  screen: (
    <>
      <rect x="3" y="4.5" width="18" height="12" rx="1.5" />
      <path d="M8.5 20h7M12 16.5V20" />
    </>
  ),
  flame: <path d="M12 3c.6 3.4 5 5.2 5 10a5 5 0 0 1-10 0c0-2.2 1.1-3.6 2.2-4.4 0 1.7.9 2.8 2.1 2.8-.3-3 .2-6 .7-8.4z" />,
  dot: <circle cx="12" cy="12" r="3" />,
  diamond: <path d="M12 3.5 20.5 12 12 20.5 3.5 12z" />,
  circle: <circle cx="12" cy="12" r="7.5" />,
  bolt: <path d="M13 3 5 13.5h6L10.5 21 19 10.5h-6z" />,
  sliders: <path d="M6 4v5M6 13v7M12 4v9M12 17v3M18 4v3M18 11v9M4 11h4M10 15h4M16 9h4" />,
  shield: <path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.7-7 9-4.1-1.3-7-4.8-7-9V6z" />,
  device: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 17.5h2" />
    </>
  ),
  rocket: <path d="M14 4.5c3-1 5.5-1 5.5-1s0 2.5-1 5.5l-6 6-4.5-4.5zM8 10.5 4.5 11l-1 2.5 4 .5M13.5 16 13 19.5l-2.5 1-.5-4M7 17c-1.5 0-2.5 1-2.5 2.5C6 19.5 7 18.5 7 17z" />,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
  bug: (
    <>
      <rect x="8" y="7.5" width="8" height="12" rx="4" />
      <path d="M9.5 7.5a2.5 2.5 0 0 1 5 0M4 12h4M16 12h4M5 7l3 2M19 7l-3 2M5 18l3-2M19 18l-3-2" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5.5l10-2V16" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="16.5" cy="16" r="2.5" />
    </>
  ),
  grid: <path d="M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z" />,
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className, size = 16, label }: { name: IconName; className?: string; size?: number; label?: string }) {
  return (
    <svg
      className={`icon${className ? ` ${className}` : ""}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {paths[name]}
    </svg>
  );
}
