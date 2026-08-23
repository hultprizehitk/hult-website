export type DebugCategory = "intro";

export type DebugLevel = "log" | "info" | "warn" | "error";

export interface DebugCategoryMeta {
  id: DebugCategory;
  label: string;
  color: string;
}

export const DEBUG_CATEGORIES: Record<DebugCategory, DebugCategoryMeta> = {
  intro: { id: "intro", label: "INTRO", color: "#f20089" },
};

const STORAGE_KEY = "hult-debug:categories";

let initialized = false;
const enabled = new Set<DebugCategory>();

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      for (const c of JSON.parse(raw) as string[]) {
        if (c in DEBUG_CATEGORIES) enabled.add(c as DebugCategory);
      }
    }
  } catch {
    // corrupted storage, start clean
  }

  try {
    const param = new URLSearchParams(window.location.search)
      .get("debug")
      ?.trim();
    if (param !== null && param !== undefined) {
      if (param === "all") {
        for (const c of Object.keys(DEBUG_CATEGORIES)) {
          enabled.add(c as DebugCategory);
        }
      } else if (param === "none") {
        enabled.clear();
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        for (const c of param.split(",")) {
          const key = c.trim() as DebugCategory;
          if (key in DEBUG_CATEGORIES) enabled.add(key);
        }
      }
    }
  } catch {
    // URL parsing unavailable
  }
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...enabled]));
  } catch {
    // storage may be blocked
  }
}

function getGpuRenderer(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ||
      canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return "WebGL UNAVAILABLE";
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = ext
      ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
      : "";
    const vendor = ext
      ? String(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL))
      : "";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return [renderer || "(masked)", vendor && `vendor=${vendor}`]
      .filter(Boolean)
      .join(" | ");
  } catch (err) {
    return `probe error: ${String(err)}`;
  }
}

function collectEnvironment(): Record<string, unknown> {
  return {
    href: window.location.href,
    userAgent: navigator.userAgent,
    screen: `${screen.width}x${screen.height} @${window.devicePixelRatio}x dpr`,
    cores: navigator.hardwareConcurrency,
    memoryGB: (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory,
    gpu: getGpuRenderer(),
    reducedMotion: window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches,
    online: navigator.onLine,
  };
}

function emit(
  category: DebugCategory,
  level: DebugLevel,
  message: string,
  data: unknown[]
) {
  ensureInit();
  if (!enabled.has(category)) return;

  const meta = DEBUG_CATEGORIES[category];
  const badge = "padding:1px 5px;border-radius:3px;font-weight:600;";
  const messageStyle =
    level === "error"
      ? "color:#ff6b6b;font-weight:600;"
      : level === "warn"
        ? "color:#ffd166;"
        : "font-weight:600;";
  const args: unknown[] = [
    `%c${meta.label}%c +${Math.round(performance.now())}ms %c${message}`,
    `background:${meta.color};color:#fff;${badge}`,
    "color:#888;",
    messageStyle,
    ...data,
  ];

  if (level === "error") console.error(...args);
  else if (level === "warn") console.warn(...args);
  else console.log(...args);
}

declare global {
  interface Window {
    __hultDebug?: {
      enable: (category: DebugCategory) => void;
      disable: (category: DebugCategory) => void;
      enableAll: () => void;
      disableAll: () => void;
      categories: () => DebugCategory[];
    };
  }
}

if (typeof window !== "undefined") {
  window.__hultDebug = {
    enable: (c) => debug.enable(c),
    disable: (c) => debug.disable(c),
    enableAll: () => debug.enableAll(),
    disableAll: () => debug.disableAll(),
    categories: () => Object.keys(DEBUG_CATEGORIES) as DebugCategory[],
  };
}

export const debug = {
  isEnabled(category: DebugCategory): boolean {
    ensureInit();
    return enabled.has(category);
  },

  enable(category: DebugCategory) {
    ensureInit();
    enabled.add(category);
    persist();
  },

  disable(category: DebugCategory) {
    ensureInit();
    enabled.delete(category);
    persist();
  },

  enableAll() {
    ensureInit();
    for (const c of Object.keys(DEBUG_CATEGORIES)) {
      enabled.add(c as DebugCategory);
    }
    persist();
  },

  disableAll() {
    ensureInit();
    enabled.clear();
    persist();
  },

  log(category: DebugCategory, message: string, ...data: unknown[]) {
    emit(category, "log", message, data);
  },

  info(category: DebugCategory, message: string, ...data: unknown[]) {
    emit(category, "info", message, data);
  },

  warn(category: DebugCategory, message: string, ...data: unknown[]) {
    emit(category, "warn", message, data);
  },

  error(category: DebugCategory, message: string, ...data: unknown[]) {
    emit(category, "error", message, data);
  },

  env(category: DebugCategory) {
    const e = collectEnvironment();
    emit(
      category,
      "info",
      `environment | gpu=${e.gpu} | cores=${e.cores} | memGB=${e.memoryGB} | screen=${e.screen} | reducedMotion=${e.reducedMotion}`,
      [e]
    );
  },
};
