// ====== ICONS (1.5px stroke, geometric) ======
// `I` is a map of icon components. Usage: <I.search size={14} />
/* eslint-disable react-refresh/only-export-components -- `I` is an icon map, not a component */

function Icon({ d, size = 16, fill = "none", stroke = "currentColor", sw = 1.5, viewBox = "0 0 24 24", style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill={fill}
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="square"
      strokeLinejoin="miter"
      style={style}
    >
      {typeof d === "string" ? <path d={d} /> : d}
    </svg>
  );
}

export const I = {
  dash:     (p) => <Icon {...p} d={<g><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></g>} />,
  users:    (p) => <Icon {...p} d={<g><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" /><circle cx="17" cy="9" r="2.5" /><path d="M15 20c0-2.2 1.8-4 4-4" /></g>} />,
  activity: (p) => <Icon {...p} d="M3 12h4l2-7 4 14 2-7h6" />,
  send:     (p) => <Icon {...p} d={<g><path d="M3 11l18-8-7 18-3-8-8-2z" /></g>} />,
  group:    (p) => <Icon {...p} d={<g><rect x="3" y="3" width="8" height="8" /><rect x="13" y="3" width="8" height="8" /><rect x="3" y="13" width="8" height="8" /><rect x="13" y="13" width="8" height="8" /></g>} />,
  contact:  (p) => <Icon {...p} d={<g><rect x="3" y="4" width="18" height="16" /><circle cx="10" cy="11" r="2.5" /><path d="M6 17c0-2 2-3 4-3s4 1 4 3" /><path d="M16 9h3M16 12h3M16 15h3" /></g>} />,
  tpl:      (p) => <Icon {...p} d={<g><rect x="3" y="3" width="18" height="18" /><path d="M3 8h18M8 8v13" /></g>} />,
  cal:      (p) => <Icon {...p} d={<g><rect x="3" y="5" width="18" height="16" /><path d="M3 10h18M8 3v4M16 3v4" /></g>} />,
  report:   (p) => <Icon {...p} d={<g><path d="M4 20V8M10 20V4M16 20v-8M22 20H2" /></g>} />,
  settings: (p) => <Icon {...p} d={<g><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" /></g>} />,
  search:   (p) => <Icon {...p} d={<g><circle cx="11" cy="11" r="6" /><path d="M20 20l-4-4" /></g>} />,
  plus:     (p) => <Icon {...p} d="M12 5v14M5 12h14" />,
  chev:     (p) => <Icon {...p} d="M9 6l6 6-6 6" />,
  dot:      (p) => <Icon {...p} d={<circle cx="12" cy="12" r="3" fill="currentColor" />} stroke="none" fill="currentColor" />,
  more:     (p) => <Icon {...p} d={<g><circle cx="5" cy="12" r="1.4" fill="currentColor" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /><circle cx="19" cy="12" r="1.4" fill="currentColor" /></g>} stroke="none" />,
  check:    (p) => <Icon {...p} d="M4 12l5 5L20 6" />,
  x:        (p) => <Icon {...p} d="M5 5l14 14M19 5L5 19" />,
  pause:    (p) => <Icon {...p} d={<g><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></g>} />,
  play:     (p) => <Icon {...p} d={<path d="M6 4l14 8-14 8z" fill="currentColor" />} stroke="none" />,
  text:     (p) => <Icon {...p} d={<g><path d="M5 6h14M9 6v14M15 6v14" /></g>} />,
  image:    (p) => <Icon {...p} d={<g><rect x="3" y="4" width="18" height="16" /><path d="M3 16l5-5 4 4 3-3 6 6" /><circle cx="9" cy="9" r="1.5" /></g>} />,
  video:    (p) => <Icon {...p} d={<g><rect x="3" y="6" width="13" height="12" /><path d="M16 10l5-3v10l-5-3z" /></g>} />,
  doc:      (p) => <Icon {...p} d={<g><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4M9 12h7M9 16h7" /></g>} />,
  list:     (p) => <Icon {...p} d={<g><rect x="3" y="5" width="18" height="3" /><rect x="3" y="11" width="18" height="3" /><rect x="3" y="17" width="18" height="3" /></g>} />,
  button:   (p) => <Icon {...p} d={<g><rect x="3" y="9" width="18" height="6" /></g>} />,
  logout:   (p) => <Icon {...p} d={<g><path d="M14 4h6v16h-6" /><path d="M4 12h11M12 8l4 4-4 4" /></g>} />,
  shield:   (p) => <Icon {...p} d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z" />,
  user1:    (p) => <Icon {...p} d={<g><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></g>} />,
  bell:     (p) => <Icon {...p} d={<g><path d="M6 16V10a6 6 0 0112 0v6l2 2H4z" /><path d="M10 21h4" /></g>} />,
  link:     (p) => <Icon {...p} d={<g><path d="M10 14a4 4 0 005.66 0l3-3a4 4 0 10-5.66-5.66L11 7" /><path d="M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 105.66 5.66L13 17" /></g>} />,
  filter:   (p) => <Icon {...p} d="M3 5h18l-7 9v6l-4-2v-4z" />,
  download: (p) => <Icon {...p} d={<g><path d="M12 4v12M7 11l5 5 5-5" /><path d="M4 20h16" /></g>} />,
  upload:   (p) => <Icon {...p} d={<g><path d="M12 20V8M7 13l5-5 5 5" /><path d="M4 20h16" /></g>} />,
  trash:    (p) => <Icon {...p} d={<g><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></g>} />,
  edit:     (p) => <Icon {...p} d={<g><path d="M4 20h4l11-11-4-4L4 16z" /></g>} />,
  clock:    (p) => <Icon {...p} d={<g><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></g>} />,
  arrow:    (p) => <Icon {...p} d="M5 12h14M13 6l6 6-6 6" />,
  refresh:  (p) => <Icon {...p} d={<g><path d="M3 12a9 9 0 0115-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 01-15 6.7L3 16" /><path d="M3 21v-5h5" /></g>} />,
};
