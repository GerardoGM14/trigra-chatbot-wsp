// Five palettes — each sets the full set of CSS variables on :root.
// The Tailwind config maps semantic color names to these vars, so switching
// a theme re-skins the whole app without touching any component.

export const THEMES = {
  arena: {
    label: "Arena",
    desc: "Crema cálido · acento terracota",
    swatches: ["#F7F5F0", "#15140F", "#C24A22"],
    vars: {
      "--bg": "#F7F5F0", "--surface": "#FFFFFF", "--surface-2": "#FBFAF6",
      "--ink": "#15140F", "--ink-2": "#3A3833", "--muted": "#7A766C", "--muted-2": "#A8A39A",
      "--border": "#E5E2DC", "--border-strong": "#D2CEC5",
      "--accent": "#C24A22", "--accent-soft": "#F5E6DE",
      "--info": "#2A4A8F", "--info-soft": "#E1E8F4",
      "--warn": "#B8801C", "--warn-soft": "#F4ECD8",
      "--danger": "#A8321F", "--danger-soft": "#F3E0DA",
    },
  },
  niebla: {
    label: "Niebla",
    desc: "Gris frío · acento azul profundo",
    swatches: ["#F2F3F5", "#0F1115", "#1F3F8F"],
    vars: {
      "--bg": "#F2F3F5", "--surface": "#FFFFFF", "--surface-2": "#F8F9FB",
      "--ink": "#0F1115", "--ink-2": "#2A2E36", "--muted": "#6E7480", "--muted-2": "#A2A7B0",
      "--border": "#E3E5EA", "--border-strong": "#CED1D8",
      "--accent": "#1F3F8F", "--accent-soft": "#E1E6F2",
      "--info": "#1F3F8F", "--info-soft": "#E1E6F2",
      "--warn": "#9E6B12", "--warn-soft": "#F1E8D2",
      "--danger": "#A8321F", "--danger-soft": "#F3DDD8",
    },
  },
  carbon: {
    label: "Carbón",
    desc: "Modo oscuro · acento ámbar",
    swatches: ["#0F1012", "#F0EDE6", "#E2853A"],
    vars: {
      "--bg": "#0F1012", "--surface": "#16181B", "--surface-2": "#1B1E22",
      "--ink": "#F0EDE6", "--ink-2": "#C8C5BD", "--muted": "#8A8780", "--muted-2": "#5A5852",
      "--border": "#262A2F", "--border-strong": "#363B41",
      "--accent": "#E2853A", "--accent-soft": "#2A1F12",
      "--info": "#5B8FE0", "--info-soft": "#172132",
      "--warn": "#D9A442", "--warn-soft": "#241D0E",
      "--danger": "#D85A3A", "--danger-soft": "#2A1612",
    },
  },
  papel: {
    label: "Papel",
    desc: "Blanco puro · acento tinta",
    swatches: ["#FFFFFF", "#0A0A09", "#0A0A09"],
    vars: {
      "--bg": "#FFFFFF", "--surface": "#FFFFFF", "--surface-2": "#FAFAF9",
      "--ink": "#0A0A09", "--ink-2": "#2D2D2A", "--muted": "#73726E", "--muted-2": "#A6A5A1",
      "--border": "#ECEBE8", "--border-strong": "#D6D5D1",
      "--accent": "#0A0A09", "--accent-soft": "#ECEBE8",
      "--info": "#1B3B82", "--info-soft": "#E3E8F3",
      "--warn": "#8A6212", "--warn-soft": "#F1EAD4",
      "--danger": "#9E2F1E", "--danger-soft": "#F2DDD8",
    },
  },
  lino: {
    label: "Lino",
    desc: "Beige claro · acento morado vino",
    swatches: ["#F1ECE2", "#1A1410", "#6B2B7A"],
    vars: {
      "--bg": "#F1ECE2", "--surface": "#FBF8F1", "--surface-2": "#F5F1E6",
      "--ink": "#1A1410", "--ink-2": "#3D3530", "--muted": "#7F7768", "--muted-2": "#A8A092",
      "--border": "#E0D9C9", "--border-strong": "#CDC4B0",
      "--accent": "#6B2B7A", "--accent-soft": "#EBDFEE",
      "--info": "#2C5970", "--info-soft": "#DFE7EC",
      "--warn": "#9C6A14", "--warn-soft": "#F0E6CE",
      "--danger": "#A03922", "--danger-soft": "#F1DDD6",
    },
  },
};

export const THEME_KEYS = Object.keys(THEMES);

// Applies a theme's CSS variables to :root. Falls back to "arena".
export function applyTheme(key) {
  const t = THEMES[key] || THEMES.arena;
  Object.entries(t.vars).forEach(([k, v]) =>
    document.documentElement.style.setProperty(k, v),
  );
}
