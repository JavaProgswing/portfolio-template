import { CSSProperties } from "react";
import { OsKey } from "./lab";

export interface Skin {
  key: OsKey;
  label: string;
  distro: string;
  wallpaper: string;
  accent: string;
  font: string;
  /** panel geometry */
  top: number;
  bottom: number;
  left: number;
  panelBg: string;
  winBg: string;
  titleBg: string;
  titleFg: string;
  text: string;
  muted: string;
  border: string;
  radius: number;
  titleH: number;
  shadow: string;
  ctl: "flat" | "round" | "classic";
  ascii: string[];
}

export const SKINS: Record<OsKey, Skin> = {
  windows: {
    key: "windows",
    label: "Windows 11",
    distro: "Windows 11 Pro",
    wallpaper:
      "radial-gradient(900px 600px at 72% 18%, rgba(59,130,246,.75), transparent 60%), radial-gradient(800px 560px at 18% 92%, rgba(124,58,237,.6), transparent 60%), linear-gradient(135deg,#071427,#0e3a78)",
    accent: "#60a5fa",
    font: "'Segoe UI Variable', 'Segoe UI', Inter, system-ui, sans-serif",
    top: 0, bottom: 48, left: 0,
    panelBg: "rgba(28,28,32,.82)",
    winBg: "#1f1f24",
    titleBg: "#2a2a30",
    titleFg: "#f3f4f6",
    text: "#e5e7eb",
    muted: "#9ca3af",
    border: "rgba(255,255,255,.09)",
    radius: 9,
    titleH: 36,
    shadow: "0 18px 50px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.06)",
    ctl: "flat",
    ascii: ["  ████████  ████████", "  ████████  ████████", "  ████████  ████████", "  ", "  ████████  ████████", "  ████████  ████████", "  ████████  ████████"],
  },
  ubuntu: {
    key: "ubuntu",
    label: "Ubuntu",
    distro: "Ubuntu 24.04 LTS",
    wallpaper:
      "radial-gradient(700px 500px at 82% 12%, rgba(233,84,32,.55), transparent 60%), radial-gradient(900px 600px at 10% 100%, rgba(174,167,159,.18), transparent 60%), linear-gradient(160deg,#5e2750,#2c001e 70%)",
    accent: "#e95420",
    font: "Ubuntu, 'Cantarell', Inter, system-ui, sans-serif",
    top: 30, bottom: 0, left: 62,
    panelBg: "rgba(18,18,18,.88)",
    winBg: "#2b2b2b",
    titleBg: "#383838",
    titleFg: "#f2f2f2",
    text: "#eeeeee",
    muted: "#a8a8a8",
    border: "rgba(255,255,255,.1)",
    radius: 12,
    titleH: 40,
    shadow: "0 14px 44px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.07)",
    ctl: "round",
    ascii: ["         _", "     ---(_)", " _/  ---  \\", "(_) |   |", "  \\  --- _/", "     ---(_)"],
  },
  debian: {
    key: "debian",
    label: "Debian",
    distro: "Debian GNU/Linux 12 (bookworm)",
    wallpaper:
      "radial-gradient(520px 520px at 28% 62%, rgba(215,10,83,.75), transparent 62%), radial-gradient(700px 500px at 85% 15%, rgba(215,10,83,.18), transparent 60%), linear-gradient(180deg,#1b0a14,#09090f)",
    accent: "#d70a53",
    font: "'DejaVu Sans', 'Cantarell', Inter, system-ui, sans-serif",
    top: 28, bottom: 32, left: 0,
    panelBg: "#1d1d21",
    winBg: "#26262b",
    titleBg: "linear-gradient(#3b3b42,#2f2f35)",
    titleFg: "#e6e6e6",
    text: "#dedede",
    muted: "#9a9aa2",
    border: "rgba(255,255,255,.12)",
    radius: 5,
    titleH: 30,
    shadow: "0 10px 32px rgba(0,0,0,.6), 0 0 0 1px rgba(0,0,0,.5)",
    ctl: "classic",
    ascii: ["   _,met$$$$$gg.", " ,g$$$$$$$$$$$$$$$P.", ",g$$P\"     \"\"\"Y$$.\".", "',$$P'              `$$$.", "$$P      ,ggs.     `$$b:", "`$$b      d$$'     ,$$P'", " $$$.      `\"\"'    ,d$$'", " `Y$$b._       _,d$P'"],
  },
};

export const ctlBtn = (skin: Skin, kind: "min" | "max" | "close"): CSSProperties => {
  const base: CSSProperties = {
    border: "none", cursor: "pointer", color: skin.titleFg, display: "grid", placeItems: "center",
    background: "transparent", padding: 0, font: "inherit", lineHeight: 1,
  };
  if (skin.ctl === "flat") return { ...base, width: 46, height: skin.titleH, fontSize: 13 };
  if (skin.ctl === "round") {
    return {
      ...base, width: 24, height: 24, borderRadius: "50%", fontSize: 11, marginLeft: 8,
      background: kind === "close" ? skin.accent : "rgba(255,255,255,.12)",
    };
  }
  return { ...base, width: 22, height: 20, fontSize: 11, marginLeft: 3, borderRadius: 3, background: "rgba(255,255,255,.08)" };
};
