import {
  createContext, CSSProperties, ElementType, ReactNode, useCallback, useContext,
  useEffect, useMemo, useRef, useState,
} from "react";
import { Box, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import {
  FaFolder, FaTerminal, FaUser, FaCog, FaGlobe, FaWindows, FaUbuntu, FaStar,
  FaCodeBranch, FaExternalLinkAlt, FaRedo, FaSearch, FaGithub,
} from "react-icons/fa";
import { SiDebian } from "react-icons/si";
import {
  LabConfig, LabProfile, LabRepo, OsKey, hostname, hueOf, timeAgo, useGithubLab,
} from "../lib/lab";
import { Skin, SKINS, ctlBtn } from "../lib/labSkins";

// ---------- types & context ----------

type Kind = "project" | "files" | "terminal" | "profile" | "settings";

interface Win {
  id: string;
  kind: Kind;
  repo?: string;
  x: number; y: number; w: number; h: number;
  z: number;
  min: boolean;
  max: boolean;
}

interface Ctx {
  skin: Skin;
  repos: LabRepo[];
  deployed: LabRepo[];
  profile: LabProfile | null;
  user: string;
  owner: string;
  setUser: (u: string) => void;
  os: OsKey;
  setOs: (o: OsKey) => void;
  hue: number;
  setHue: (h: number) => void;
  open: (kind: Kind, repo?: string) => void;
  loading: boolean;
  offline: boolean;
  error: string;
}

const LabCtx = createContext<Ctx>(null as unknown as Ctx);
const useLab = () => useContext(LabCtx);

const I = (c: unknown) => c as ElementType;

const FaCodeBranch_ = I(FaCodeBranch);
const FaExternalLinkAlt_ = I(FaExternalLinkAlt);
const FaGithub_ = I(FaGithub);
const FaGlobe_ = I(FaGlobe);
const FaRedo_ = I(FaRedo);
const FaSearch_ = I(FaSearch);
const FaStar_ = I(FaStar);
const FaWindows_ = I(FaWindows);

const PREF_KEY = "lab-prefs";
interface Prefs { os?: OsKey; hue?: number; user?: string }
const loadPrefs = (): Prefs => {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || "{}"); } catch { return {}; }
};

const ghHandle = (contacts: { id: string; link: string }[] = []): string => {
  const link = contacts.find((c) => c.id === "github")?.link || "";
  const m = link.match(/github\.com\/([^/?#]+)/i);
  return m ? m[1] : "";
};

// ---------- small bits ----------

const AppIcon = ({ repo, size = 40 }: { repo: LabRepo; size?: number }) => {
  const [bad, setBad] = useState(false);
  const h = hueOf(repo.name);
  const host = repo.deployUrl ? hostname(repo.deployUrl) : "";
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.24, display: "grid", placeItems: "center",
      background: `linear-gradient(135deg, hsl(${h} 70% 55%), hsl(${(h + 50) % 360} 70% 38%))`,
      color: "#fff", fontWeight: 700, fontSize: size * 0.42, overflow: "hidden", flexShrink: 0,
      boxShadow: "0 3px 10px rgba(0,0,0,.35)",
    }}>
      {host && !bad ? (
        <img
          src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`} alt="" width={size * 0.6} height={size * 0.6}
          onError={() => setBad(true)} style={{ background: "rgba(255,255,255,.92)", borderRadius: 6, padding: 2 }}
        />
      ) : (
        repo.name.charAt(0).toUpperCase()
      )}
    </div>
  );
};

const SysIcon = ({ kind, size = 40 }: { kind: Kind; size?: number }) => {
  const { skin } = useLab();
  const map: Record<Kind, [unknown, string]> = {
    files: [FaFolder, "#f59e0b"], terminal: [FaTerminal, "#111827"], profile: [FaUser, "#6366f1"],
    settings: [FaCog, "#64748b"], project: [FaGlobe, skin.accent],
  };
  const [Ico, bg] = map[kind];
  const Comp = I(Ico);
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.24, display: "grid", placeItems: "center",
      background: bg, color: "#fff", flexShrink: 0, boxShadow: "0 3px 10px rgba(0,0,0,.35)",
      border: kind === "terminal" ? "1px solid rgba(255,255,255,.25)" : undefined,
    }}>
      <Comp size={size * 0.46} />
    </div>
  );
};

const SYS_APPS: { kind: Kind; label: string }[] = [
  { kind: "files", label: "Files" },
  { kind: "terminal", label: "Terminal" },
  { kind: "profile", label: "Profile" },
  { kind: "settings", label: "Settings" },
];

const Chip = ({ children }: { children: ReactNode }) => {
  const { skin } = useLab();
  return (
    <span style={{
      fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "rgba(255,255,255,.08)",
      border: `1px solid ${skin.border}`, color: skin.text, whiteSpace: "nowrap",
    }}>{children}</span>
  );
};

// ---------- apps ----------

const ProjectApp = ({ repo }: { repo: LabRepo }) => {
  const { skin } = useLab();
  const canPreview = !!repo.deployUrl && !repo.down;
  const [tab, setTab] = useState<"preview" | "about">(canPreview ? "preview" : "about");
  const [nonce, setNonce] = useState(0);
  // Sites that forbid framing start on a snapshot; everyone can toggle by hand.
  const [snap, setSnap] = useState(!repo.embeddable);
  const tabBtn = (t: "preview" | "about", label: string) => (
    <button
      onClick={() => setTab(t)}
      style={{
        background: "none", border: "none", cursor: "pointer", color: tab === t ? skin.text : skin.muted,
        borderBottom: `2px solid ${tab === t ? skin.accent : "transparent"}`, padding: "8px 14px", font: "inherit", fontSize: 13,
      }}
    >{label}</button>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 6px", borderBottom: `1px solid ${skin.border}` }}>
        {canPreview && tabBtn("preview", "Live preview")}
        {tabBtn("about", "About")}
        <div style={{ flex: 1 }} />
        {canPreview && tab === "preview" && (
          <button onClick={() => setSnap((v) => !v)}
            style={{ background: "rgba(255,255,255,.08)", border: `1px solid ${skin.border}`, color: skin.text, cursor: "pointer", padding: "3px 10px", borderRadius: 999, font: "inherit", fontSize: 11 }}>
            {snap ? "Try live embed" : "Show snapshot"}
          </button>
        )}
        {canPreview && tab === "preview" && !snap && (
          <button title="Reload" onClick={() => setNonce((n) => n + 1)}
            style={{ background: "none", border: "none", color: skin.muted, cursor: "pointer", padding: 6 }}>
            <FaRedo_ size={12} />
          </button>
        )}
      </div>

      {tab === "preview" && canPreview ? (
        <>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderBottom: `1px solid ${skin.border}`,
            fontSize: 12, color: skin.muted,
          }}>
            <span style={{
              flex: 1, background: "rgba(255,255,255,.06)", borderRadius: 999, padding: "4px 12px",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>🔒 {repo.deployUrl}</span>
            <a href={repo.deployUrl} target="_blank" rel="noopener noreferrer"
              style={{ color: skin.accent, display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
              open <FaExternalLinkAlt_ size={10} />
            </a>
          </div>
          {snap ? (
            <div style={{ flex: 1, minHeight: 0, overflow: "auto", background: "#111", textAlign: "center" }}>
              <img
                src={`https://s0.wp.com/mshots/v1/${encodeURIComponent(repo.deployUrl)}?w=1200&h=800`}
                alt={`Snapshot of ${repo.name}`} style={{ width: "100%", display: "block" }}
              />
            </div>
          ) : (
            <iframe
              key={nonce} title={repo.name} src={repo.deployUrl} loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              style={{ flex: 1, border: "none", background: "#fff", width: "100%", minHeight: 0 }}
            />
          )}
          <div style={{ padding: "5px 10px", fontSize: 11, color: skin.muted, borderTop: `1px solid ${skin.border}` }}>
            {snap
              ? (repo.embeddable ? "Snapshot via WordPress mShots (may take a few seconds to render)." : "This site blocks embedding, so this is a snapshot. Use “open” for the real thing.")
              : "Blank or refused? Some sites forbid embedding. Try the snapshot or use “open”."}
          </div>
        </>
      ) : (
        <div style={{ padding: 18, overflow: "auto", flex: 1 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
            <AppIcon repo={repo} size={56} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: skin.text, overflowWrap: "anywhere" }}>{repo.name}</div>
              <div style={{ fontSize: 12, color: skin.muted }}>
                {repo.down ? "deployment offline" : repo.host ? `deployed on ${repo.host}` : "not deployed (source only)"} · updated {timeAgo(repo.pushedAt) || "n/a"}
              </div>
            </div>
          </div>
          {repo.down && (
            <p style={{ background: "rgba(248,113,113,.12)", border: "1px solid rgba(248,113,113,.4)", color: "#fca5a5", borderRadius: skin.radius, padding: "8px 12px", fontSize: 13, margin: "0 0 14px" }}>
              The live site ({repo.deployUrl}) is not responding right now, so there is no preview.
            </p>
          )}
          <p style={{ color: skin.text, lineHeight: 1.65, fontSize: 14, margin: "0 0 14px" }}>
            {repo.description || "No description provided."}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, paddingTop: 4 }}>
            {repo.language && <Chip>{repo.language}</Chip>}
            <Chip><FaStar_ size={10} style={{ display: "inline", marginRight: 4 }} />{repo.stars}</Chip>
            <Chip><FaCodeBranch_ size={10} style={{ display: "inline", marginRight: 4 }} />{repo.forks}</Chip>
            {repo.topics.map((t) => <Chip key={t}>#{t}</Chip>)}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {repo.deployUrl && !repo.down && <LinkBtn href={repo.deployUrl} primary><FaGlobe_ size={12} /> Open live site</LinkBtn>}
            {repo.url && <LinkBtn href={repo.url}><FaGithub_ size={12} /> Source</LinkBtn>}
          </div>
        </div>
      )}
    </div>
  );
};

const LinkBtn = ({ href, children, primary }: { href: string; children: ReactNode; primary?: boolean }) => {
  const { skin } = useLab();
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
      display: "inline-flex", gap: 7, alignItems: "center", padding: "8px 14px", borderRadius: skin.radius,
      background: primary ? skin.accent : "rgba(255,255,255,.08)", color: primary ? "#fff" : skin.text,
      fontSize: 13, border: `1px solid ${skin.border}`, textDecoration: "none",
    }}>{children}</a>
  );
};

type Sort = "recent" | "stars" | "name";

const FilesApp = () => {
  const { skin, repos, deployed, open } = useLab();
  const [view, setView] = useState<"deployed" | "all">(deployed.length ? "deployed" : "all");
  const [sort, setSort] = useState<Sort>("recent");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState("");

  const list = useMemo(() => {
    const base = (view === "deployed" ? deployed : repos).filter((r) => {
      const n = q.trim().toLowerCase();
      return !n || r.name.toLowerCase().includes(n) || r.description.toLowerCase().includes(n) || r.language.toLowerCase().includes(n);
    });
    return [...base].sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name)
        : sort === "stars" ? b.stars - a.stars
          : new Date(b.pushedAt || 0).getTime() - new Date(a.pushedAt || 0).getTime());
  }, [view, sort, q, repos, deployed]);

  const side = (key: "deployed" | "all", label: string, n: number) => (
    <button onClick={() => setView(key)} style={{
      display: "flex", justifyContent: "space-between", width: "100%", textAlign: "left", cursor: "pointer",
      padding: "8px 12px", borderRadius: skin.radius - 2, border: "none", font: "inherit", fontSize: 13,
      background: view === key ? "rgba(255,255,255,.1)" : "transparent", color: skin.text,
    }}><span>{label}</span><span style={{ color: skin.muted }}>{n}</span></button>
  );

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
      <div style={{ width: 150, padding: 8, borderRight: `1px solid ${skin.border}`, flexShrink: 0 }} className="lab-side">
        <div style={{ fontSize: 10, letterSpacing: ".12em", color: skin.muted, padding: "4px 12px", textTransform: "uppercase" }}>Places</div>
        {side("deployed", "Deployed", deployed.length)}
        {side("all", "All repos", repos.length)}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, padding: 8, borderBottom: `1px solid ${skin.border}`, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <FaSearch_ size={11} style={{ position: "absolute", left: 10, top: 10, color: skin.muted }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search"
              style={{ ...inputStyle(skin), paddingLeft: 28, width: "100%" }} />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} style={inputStyle(skin)}>
            <option value="recent">Recent</option>
            <option value="stars">Stars</option>
            <option value="name">Name</option>
          </select>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 10 }}>
          {list.length === 0 && (
            <div style={{ color: skin.muted, fontSize: 13, padding: 20, textAlign: "center" }}>
              {view === "deployed" ? "No live deployments detected. Try “All repos”." : "Nothing here."}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 8 }}>
            {list.map((r) => (
              <button key={r.name}
                onClick={() => (sel === r.name ? open("project", r.name) : setSel(r.name))}
                onDoubleClick={() => open("project", r.name)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 6px", cursor: "pointer",
                  borderRadius: skin.radius, border: `1px solid ${sel === r.name ? skin.accent : "transparent"}`,
                  background: sel === r.name ? "rgba(255,255,255,.08)" : "transparent", color: skin.text, font: "inherit",
                }}>
                <AppIcon repo={r} size={44} />
                <span style={{ fontSize: 12, textAlign: "center", overflowWrap: "anywhere", lineHeight: 1.25 }}>{r.name}</span>
                <span style={{ fontSize: 10, color: skin.muted }}>{r.host || r.language || "repo"}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ padding: "5px 12px", fontSize: 11, color: skin.muted, borderTop: `1px solid ${skin.border}` }}>
          {list.length} item{list.length === 1 ? "" : "s"} · click twice or double-click to open
        </div>
      </div>
    </div>
  );
};

const inputStyle = (skin: Skin): CSSProperties => ({
  background: "rgba(255,255,255,.07)", border: `1px solid ${skin.border}`, color: skin.text,
  borderRadius: skin.radius - 2, padding: "6px 10px", font: "inherit", fontSize: 13, outline: "none",
});

interface Line { t: string; c?: "cmd" | "err" | "dim" | "acc" }

const TerminalApp = () => {
  const { skin, repos, deployed, profile, user, setUser, setOs, open } = useLab();
  const prompt = `${user || "guest"}@${skin.key === "windows" ? "wsl" : skin.key}:~$`;
  const [lines, setLines] = useState<Line[]>([
    { t: "Type `help` to see commands. Try `ls`, `open <name>`, `neofetch`.", c: "dim" },
  ]);
  const [val, setVal] = useState("");
  const hist = useRef<string[]>([]);
  const hi = useRef(-1);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [lines]);

  const run = (raw: string) => {
    const cmd = raw.trim();
    const out: Line[] = [{ t: `${prompt} ${raw}`, c: "cmd" }];
    if (!cmd) { setLines((l) => [...l, ...out]); return; }
    hist.current.push(cmd); hi.current = -1;
    const [c, ...args] = cmd.split(/\s+/);
    const arg = args.join(" ");
    const find = (n: string) => repos.find((r) => r.name.toLowerCase() === n.toLowerCase())
      || repos.find((r) => r.name.toLowerCase().includes(n.toLowerCase()));
    const push = (...t: string[]) => t.forEach((x) => out.push({ t: x }));
    switch (c) {
      case "help":
        push("help               this list", "ls [-a]            deployed projects (-a: every repo)", "open <name>        launch a project window",
          "cat <name>         project details", "whoami            who owns this desktop", "neofetch          system info",
          "user <github>      switch to another GitHub user", "os <windows|ubuntu|debian>   change desktop skin",
          "date | echo | clear");
        break;
      case "ls": {
        const all = args.includes("-a");
        const src = all ? repos : deployed;
        if (!src.length) push(all ? "(no repos)" : "(no live deployments found, try ls -a)");
        src.forEach((r) => push(`${r.deployUrl ? "🌐" : "📁"} ${r.name.padEnd(28)} ${(r.host || r.language || "").padEnd(12)} ${timeAgo(r.pushedAt)}`));
        break;
      }
      case "open": {
        const r = find(arg);
        if (!arg) out.push({ t: "usage: open <project-name>", c: "err" });
        else if (!r) out.push({ t: `open: ${arg}: no such project`, c: "err" });
        else { open("project", r.name); push(`opening ${r.name}…`); }
        break;
      }
      case "cat": {
        const r = find(arg);
        if (!r) out.push({ t: `cat: ${arg || "?"}: no such project`, c: "err" });
        else push(`name:      ${r.name}`, `about:     ${r.description || "-"}`, `language:  ${r.language || "-"}`,
          `live:      ${r.deployUrl || "not deployed"}`, `source:    ${r.url}`, `stars:     ${r.stars}   forks: ${r.forks}`,
          `pushed:    ${timeAgo(r.pushedAt) || "-"}`);
        break;
      }
      case "whoami": push(profile ? `${profile.name} (@${profile.login}) · ${profile.bio || "no bio"}` : user); break;
      case "neofetch":
        skin.ascii.forEach((a) => out.push({ t: a, c: "acc" }));
        push(`${user}@${skin.key}`, "-----------", `OS: ${skin.distro}`, `Shell: portfolio-sh 1.0`,
          `Projects: ${repos.length} (${deployed.length} live)`, `Host: ${typeof navigator !== "undefined" ? navigator.platform || "browser" : "browser"}`);
        break;
      case "user":
        if (!arg) out.push({ t: "usage: user <github-username>", c: "err" });
        else { setUser(arg); push(`switching to ${arg}…`); }
        break;
      case "os":
        if (["windows", "ubuntu", "debian"].includes(arg)) { setOs(arg as OsKey); push(`desktop is now ${arg}`); }
        else out.push({ t: "usage: os <windows|ubuntu|debian>", c: "err" });
        break;
      case "date": push(new Date().toString()); break;
      case "echo": push(arg); break;
      case "clear": setLines([]); return;
      case "sudo": out.push({ t: `${user} is not in the sudoers file. This incident will be reported.`, c: "err" }); break;
      default: out.push({ t: `${c}: command not found`, c: "err" });
    }
    setLines((l) => [...l, ...out]);
  };

  const color = (c?: Line["c"]) =>
    c === "err" ? "#f87171" : c === "dim" ? skin.muted : c === "acc" ? skin.accent : c === "cmd" ? "#86efac" : "#e5e7eb";

  return (
    <div onClick={() => document.getElementById("lab-term-input")?.focus()}
      style={{ height: "100%", background: "#0c0c0f", padding: 12, overflow: "auto", fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, lineHeight: 1.55 }}>
      {lines.map((l, i) => <div key={i} style={{ color: color(l.c), whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{l.t}</div>)}
      <div style={{ display: "flex", gap: 8 }}>
        <span style={{ color: "#86efac", whiteSpace: "nowrap" }}>{prompt}</span>
        <input
          id="lab-term-input" value={val} autoComplete="off" spellCheck={false} autoCapitalize="off"
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { run(val); setVal(""); }
            else if (e.key === "ArrowUp") {
              e.preventDefault();
              if (!hist.current.length) return;
              hi.current = hi.current < 0 ? hist.current.length - 1 : Math.max(0, hi.current - 1);
              setVal(hist.current[hi.current]);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              if (hi.current < 0) return;
              hi.current += 1;
              if (hi.current >= hist.current.length) { hi.current = -1; setVal(""); } else setVal(hist.current[hi.current]);
            }
          }}
          style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", color: "#e5e7eb", font: "inherit" }}
        />
      </div>
      <div ref={endRef} />
    </div>
  );
};

const ProfileApp = () => {
  const { skin, profile, repos, deployed, user, loading, offline } = useLab();
  const langs = useMemo(() => {
    const m = new Map<string, number>();
    repos.forEach((r) => r.language && m.set(r.language, (m.get(r.language) || 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [repos]);
  const stars = repos.reduce((s, r) => s + r.stars, 0);
  return (
    <div style={{ padding: 20, overflow: "auto", height: "100%", color: skin.text }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
        {profile?.avatar ? (
          <img src={profile.avatar} alt="" width={72} height={72} style={{ borderRadius: "50%", border: `2px solid ${skin.accent}` }} />
        ) : (
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: skin.accent, display: "grid", placeItems: "center", fontSize: 28, color: "#fff" }}>
            {user.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{profile?.name || user}</div>
          <div style={{ color: skin.muted, fontSize: 13 }}>@{profile?.login || user}{profile?.location ? ` · ${profile.location}` : ""}</div>
        </div>
      </div>
      {profile?.bio && <p style={{ lineHeight: 1.6, fontSize: 14, margin: "0 0 14px" }}>{profile.bio}</p>}
      {offline && <p style={{ fontSize: 12, color: skin.muted }}>Live GitHub data unavailable; showing the bundled snapshot.</p>}
      {loading && <p style={{ fontSize: 12, color: skin.muted }}>Loading…</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(90px,1fr))", gap: 8, marginBottom: 16 }}>
        {[["Repos", profile?.publicRepos ?? repos.length], ["Live", deployed.length], ["Stars", stars], ["Followers", profile?.followers ?? "-"]].map(([k, v]) => (
          <div key={String(k)} style={{ padding: 10, borderRadius: skin.radius, background: "rgba(255,255,255,.06)", border: `1px solid ${skin.border}`, textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{v}</div>
            <div style={{ fontSize: 11, color: skin.muted }}>{k}</div>
          </div>
        ))}
      </div>
      {langs.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {langs.map(([l, n]) => <Chip key={l}>{l} · {n}</Chip>)}
        </div>
      )}
      <LinkBtn href={profile?.url || `https://github.com/${user}`} primary><FaGithub_ size={12} /> Open on GitHub</LinkBtn>
    </div>
  );
};

const SettingsApp = () => {
  const { skin, user, setUser, os, setOs, hue, setHue, owner, error, loading } = useLab();
  const [draft, setDraft] = useState(user);
  useEffect(() => setDraft(user), [user]);
  const label: CSSProperties = { fontSize: 11, textTransform: "uppercase", letterSpacing: ".12em", color: skin.muted, margin: "16px 0 8px" };
  const osBtn = (k: OsKey, Ico: unknown) => {
    const Comp = I(Ico);
    return (
      <button key={k} onClick={() => setOs(k)} style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 6px", cursor: "pointer",
        borderRadius: skin.radius, font: "inherit", fontSize: 12, color: skin.text,
        background: os === k ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.04)",
        border: `1px solid ${os === k ? skin.accent : skin.border}`,
      }}><Comp size={20} />{SKINS[k].label}</button>
    );
  };
  return (
    <div style={{ padding: 18, overflow: "auto", height: "100%", color: skin.text }}>
      <div style={{ ...label, marginTop: 0 }}>Whose desktop is this?</div>
      <form onSubmit={(e) => { e.preventDefault(); const u = draft.trim().replace(/^@/, ""); if (u) setUser(u); }} style={{ display: "flex", gap: 8 }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="github username" style={{ ...inputStyle(skin), flex: 1, minWidth: 0 }} />
        <button type="submit" style={{ ...inputStyle(skin), background: skin.accent, color: "#fff", cursor: "pointer", border: "none" }}>Load</button>
      </form>
      <div style={{ fontSize: 12, color: error ? "#f87171" : skin.muted, marginTop: 6 }}>
        {error || (loading ? "Fetching from GitHub…" : "Any public GitHub user works. Deployed = repos whose homepage points at a live site.")}
      </div>
      {user.toLowerCase() !== owner.toLowerCase() && (
        <button onClick={() => setUser(owner)} style={{ ...inputStyle(skin), marginTop: 8, cursor: "pointer" }}>↩ back to {owner}</button>
      )}
      <div style={label}>Operating system</div>
      <div style={{ display: "flex", gap: 8 }}>
        {osBtn("windows", FaWindows)}{osBtn("ubuntu", FaUbuntu)}{osBtn("debian", SiDebian)}
      </div>
      <div style={label}>Wallpaper tint</div>
      <input type="range" min={0} max={360} value={hue} onChange={(e) => setHue(Number(e.target.value))} style={{ width: "100%", accentColor: skin.accent }} />
    </div>
  );
};

// ---------- window chrome ----------

const WIN_MIN = { w: 340, h: 240 };

interface FrameProps {
  win: Win; title: string; icon: ReactNode; active: boolean; compact: boolean;
  area: { x: number; y: number; w: number; h: number };
  onFocus: () => void; onChange: (p: Partial<Win>) => void; onClose: () => void; children: ReactNode;
}

const Frame = ({ win, title, icon, active, compact, area, onFocus, onChange, onClose, children }: FrameProps) => {
  const { skin } = useLab();
  const full = win.max || compact;
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const size = useRef<{ px: number; py: number; w: number; h: number } | null>(null);

  const geo: CSSProperties = full
    ? { left: area.x, top: area.y, width: area.w, height: area.h, borderRadius: compact ? 0 : skin.radius > 6 ? 0 : 0 }
    : { left: win.x, top: win.y, width: win.w, height: win.h, borderRadius: skin.radius };

  const ctl = (kind: "min" | "max" | "close", glyph: string, label: string, onClick: () => void) => (
    <button key={kind} aria-label={label} title={label} onClick={onClick} style={ctlBtn(skin, kind)}
      onMouseEnter={(e) => { if (skin.ctl === "flat") e.currentTarget.style.background = kind === "close" ? "#e81123" : "rgba(255,255,255,.1)"; }}
      onMouseLeave={(e) => { if (skin.ctl === "flat") e.currentTarget.style.background = "transparent"; }}>
      {glyph}
    </button>
  );

  return (
    <div
      className="lab-window"
      onPointerDown={onFocus}
      style={{
        position: "absolute", ...geo, zIndex: win.z, display: win.min ? "none" : "flex", flexDirection: "column",
        background: skin.winBg, boxShadow: active ? skin.shadow : "0 6px 20px rgba(0,0,0,.35)", overflow: "hidden",
        opacity: active ? 1 : 0.96, color: skin.text, border: `1px solid ${skin.border}`,
        animation: "lab-window-in 220ms cubic-bezier(.2,.75,.25,1) both",
      }}
    >
      <div
        onDoubleClick={() => !compact && onChange({ max: !win.max })}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button") || full) return;
          drag.current = { px: e.clientX, py: e.clientY, x: win.x, y: win.y };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current; if (!d) return;
          const nx = Math.min(Math.max(d.x + e.clientX - d.px, area.x - win.w + 80), area.x + area.w - 80);
          const ny = Math.min(Math.max(d.y + e.clientY - d.py, area.y), area.y + area.h - 30);
          onChange({ x: nx, y: ny });
        }}
        onPointerUp={() => { drag.current = null; }}
        style={{
          height: skin.titleH, background: skin.titleBg, color: skin.titleFg, display: "flex", alignItems: "center",
          padding: skin.ctl === "flat" ? "0 0 0 12px" : "0 10px", gap: 8, flexShrink: 0, userSelect: "none",
          cursor: full ? "default" : "grab", touchAction: "none", fontSize: 13,
        }}
      >
        {icon}
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: skin.ctl === "round" ? 600 : 400 }}>{title}</span>
        <div style={{ display: "flex" }}>
          {ctl("min", skin.ctl === "flat" ? "—" : "–", "Minimize", () => onChange({ min: true }))}
          {!compact && ctl("max", win.max ? "❐" : "☐", win.max ? "Restore" : "Maximize", () => onChange({ max: !win.max }))}
          {ctl("close", "✕", "Close", onClose)}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>{children}</div>
      {!full && (
        <div
          onPointerDown={(e) => {
            size.current = { px: e.clientX, py: e.clientY, w: win.w, h: win.h };
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            e.stopPropagation();
          }}
          onPointerMove={(e) => {
            const s = size.current; if (!s) return;
            onChange({ w: Math.max(WIN_MIN.w, s.w + e.clientX - s.px), h: Math.max(WIN_MIN.h, s.h + e.clientY - s.py) });
          }}
          onPointerUp={() => { size.current = null; }}
          style={{ position: "absolute", right: 0, bottom: 0, width: 18, height: 18, cursor: "nwse-resize", touchAction: "none" }}
        />
      )}
    </div>
  );
};

// ---------- launcher / clock ----------

const Clock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 15000); return () => clearInterval(t); }, []);
  return <>{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>;
};

const Launcher = ({ onClose }: { onClose: () => void }) => {
  const { skin, deployed, repos, open } = useLab();
  const [q, setQ] = useState("");
  const n = q.trim().toLowerCase();
  const projects = (deployed.length ? deployed : repos).filter((r) => !n || r.name.toLowerCase().includes(n));
  const apps = SYS_APPS.filter((a) => !n || a.label.toLowerCase().includes(n));
  const go = (k: Kind, r?: string) => { open(k, r); onClose(); };

  const pos: CSSProperties =
    skin.key === "windows" ? { left: "50%", bottom: skin.bottom + 10, transform: "translateX(-50%)", width: "min(560px, 94%)", maxHeight: "72%", borderRadius: 14 }
      : skin.key === "ubuntu" ? { left: skin.left + 14, top: skin.top + 10, width: "min(620px, calc(100% - 90px))", maxHeight: "82%", borderRadius: 16 }
        : { left: 6, top: skin.top + 2, width: "min(340px, 96%)", maxHeight: "76%", borderRadius: 6 };

  return (
    <>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, zIndex: 8000 }} />
      <div style={{
        position: "absolute", ...pos, zIndex: 8001, background: skin.key === "ubuntu" ? "rgba(30,30,30,.96)" : skin.panelBg,
        backdropFilter: "blur(24px)", border: `1px solid ${skin.border}`, boxShadow: skin.shadow, padding: 14,
        display: "flex", flexDirection: "column", gap: 10, color: skin.text,
      }}>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type to search apps and projects"
          style={{ ...inputStyle(skin), padding: "9px 14px" }} />
        <div style={{ overflow: "auto", display: "grid", gridTemplateColumns: skin.key === "debian" ? "1fr" : "repeat(auto-fill,minmax(88px,1fr))", gap: 6 }}>
          {[...apps.map((a) => ({ key: a.kind, label: a.label, icon: <SysIcon kind={a.kind} size={36} />, run: () => go(a.kind) })),
            ...projects.map((r) => ({ key: r.name, label: r.name, icon: <AppIcon repo={r} size={36} />, run: () => go("project", r.name) }))].map((it) => (
            <button key={it.key} onClick={it.run} style={{
              display: "flex", flexDirection: skin.key === "debian" ? "row" : "column", alignItems: "center", gap: 8, padding: 8,
              background: "transparent", border: "none", borderRadius: skin.radius, color: skin.text, cursor: "pointer", font: "inherit",
              fontSize: 12, textAlign: skin.key === "debian" ? "left" : "center", overflowWrap: "anywhere",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              {it.icon}<span>{it.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

// ---------- page ----------

const LabPage = ({ data }: { data: { name: string; contacts: { id: string; link: string }[]; lab?: LabConfig } }) => {
  const owner = data.lab?.defaultUser || ghHandle(data.contacts) || "octocat";
  const prefs = useMemo(loadPrefs, []);
  const params = useMemo(() => new URLSearchParams(window.location.search), []);

  const [user, setUserState] = useState(() => (params.get("user") || prefs.user || owner).replace(/^@/, ""));
  const [os, setOs] = useState<OsKey>(() => {
    const p = params.get("os") as OsKey | null;
    return p && SKINS[p] ? p : prefs.os && SKINS[prefs.os] ? prefs.os : "windows";
  });
  const [hue, setHue] = useState(prefs.hue ?? 0);
  const skin = SKINS[os];

  const setUser = useCallback((u: string) => {
    setUserState(u);
    const url = new URL(window.location.href);
    if (u.toLowerCase() === owner.toLowerCase()) url.searchParams.delete("user"); else url.searchParams.set("user", u);
    window.history.replaceState(null, "", url);
  }, [owner]);

  useEffect(() => {
    try { localStorage.setItem(PREF_KEY, JSON.stringify({ os, hue, user })); } catch { /* ignore */ }
  }, [os, hue, user]);

  const lab = useGithubLab(user, owner, data.lab || {});
  const deployed = useMemo(() => lab.repos.filter((r) => r.deployUrl && !r.down && !r.fork), [lab.repos]);

  // frame geometry
  const frameRef = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ w: 1000, h: 600 });
  useEffect(() => {
    const el = frameRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setDim({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el); setDim({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);
  const compact = dim.w < 720;
  const area = { x: skin.left, y: skin.top, w: dim.w - skin.left, h: dim.h - skin.top - skin.bottom };

  // windows
  const [wins, setWins] = useState<Win[]>([]);
  const zRef = useRef(10);
  const [launcher, setLauncher] = useState(false);
  const [selIcon, setSelIcon] = useState("");

  const patch = useCallback((id: string, p: Partial<Win>) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, ...p } : w))), []);
  const focus = useCallback((id: string) => {
    setWins((ws) => {
      const top = Math.max(...ws.map((w) => w.z), 0);
      const cur = ws.find((w) => w.id === id);
      if (!cur || cur.z === top) return ws;
      return ws.map((w) => (w.id === id ? { ...w, z: ++zRef.current } : w));
    });
  }, []);

  const open = useCallback((kind: Kind, repo?: string) => {
    const id = repo ? `${kind}:${repo}` : kind;
    setWins((ws) => {
      if (ws.some((w) => w.id === id)) return ws.map((w) => (w.id === id ? { ...w, min: false, z: ++zRef.current } : w));
      const n = ws.length % 6;
      const w = kind === "project" ? 760 : kind === "terminal" ? 600 : kind === "files" ? 680 : 460;
      const h = kind === "project" ? 520 : kind === "settings" ? 440 : 420;
      return [...ws, {
        id, kind, repo,
        x: skin.left + 40 + n * 28, y: skin.top + 24 + n * 26,
        w: Math.min(w, Math.max(WIN_MIN.w, dim.w - skin.left - 60)), h: Math.min(h, Math.max(WIN_MIN.h, dim.h - skin.top - skin.bottom - 50)),
        z: ++zRef.current, min: false, max: false,
      }];
    });
  }, [skin.left, skin.top, skin.bottom, dim.w, dim.h]);

  const close = useCallback((id: string) => setWins((ws) => ws.filter((w) => w.id !== id)), []);

  // drop windows for repos that no longer exist after switching users
  useEffect(() => {
    setWins((ws) => ws.filter((w) => !w.repo || lab.repos.some((r) => r.name === w.repo)));
  }, [lab.repos]);

  // open Files once on desktop-size screens after the data loads
  const autoOpened = useRef(false);
  useEffect(() => {
    if (!autoOpened.current && !lab.loading && !compact) { autoOpened.current = true; open("files"); }
  }, [lab.loading, compact, open]);

  const topId = wins.filter((w) => !w.min).sort((a, b) => b.z - a.z)[0]?.id;
  const toggleFromBar = (w: Win) => {
    if (w.min) open(w.kind, w.repo);
    else if (w.id === topId) patch(w.id, { min: true });
    else focus(w.id);
  };

  const ctx: Ctx = {
    skin, repos: lab.repos, deployed, profile: lab.profile, user, owner, setUser, os, setOs, hue, setHue, open,
    loading: lab.loading, offline: lab.offline, error: lab.error,
  };

  const render = (w: Win): { title: string; icon: ReactNode; body: ReactNode } => {
    if (w.kind === "project") {
      const r = lab.repos.find((x) => x.name === w.repo);
      return { title: r ? r.name : "Project", icon: r ? <AppIcon repo={r} size={18} /> : null, body: r ? <ProjectApp repo={r} /> : null };
    }
    const label = SYS_APPS.find((a) => a.kind === w.kind)?.label || "App";
    const body = w.kind === "files" ? <FilesApp /> : w.kind === "terminal" ? <TerminalApp /> : w.kind === "profile" ? <ProfileApp /> : <SettingsApp />;
    return { title: w.kind === "terminal" ? `${user}@${skin.key}: ~` : label, icon: <SysIcon kind={w.kind} size={18} />, body };
  };

  const desktopRepos = deployed.length ? deployed : lab.repos.slice(0, 8);
  const iconBtn = (key: string, label: string, icon: ReactNode, run: () => void) => (
    <button key={key}
      onClick={() => (compact || selIcon === key ? run() : setSelIcon(key))}
      onDoubleClick={run}
      style={{
        width: 88, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "8px 4px", border: "1px solid transparent",
        borderRadius: skin.radius, background: selIcon === key ? "rgba(255,255,255,.14)" : "transparent",
        borderColor: selIcon === key ? "rgba(255,255,255,.25)" : "transparent", cursor: "pointer", color: "#fff", font: "inherit",
      }}>
      {icon}
      <span style={{ fontSize: 11.5, textAlign: "center", lineHeight: 1.2, overflowWrap: "anywhere", textShadow: "0 1px 3px rgba(0,0,0,.8)" }}>{label}</span>
    </button>
  );

  // panel pieces ---------------------------------------------------------
  const winButtons = wins.map((w) => {
    const r = render(w);
    const active = !w.min && w.id === topId;
    return (
      <button key={w.id} title={r.title} onClick={() => toggleFromBar(w)} style={{
        display: "flex", alignItems: "center", gap: 7, padding: skin.key === "windows" ? "6px 10px" : "3px 10px", maxWidth: 160,
        border: "none", borderRadius: skin.radius - 2, cursor: "pointer", font: "inherit", fontSize: 12, color: skin.text,
        background: active ? "rgba(255,255,255,.16)" : "rgba(255,255,255,.06)",
        borderBottom: `2px solid ${w.min ? "transparent" : skin.accent}`,
      }}>
        {r.icon}
        {(skin.key !== "windows" || !compact) && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>}
      </button>
    );
  });

  const OsIcon = I(os === "windows" ? FaWindows : os === "ubuntu" ? FaUbuntu : SiDebian);

  return (
    <LabCtx.Provider value={ctx}>
      <Box maxW="1400px" mx="auto" px={{ base: 2, md: 6 }} pt={{ base: 3, md: 5 }} pb={{ base: 3, md: 6 }}>
        <Box display="flex" justifyContent="space-between" alignItems="baseline" mb={3} px={1} gap={3} flexWrap="wrap">
          <Box>
            <Text as={RouterLink} to="/" fontSize="11px" fontFamily="mono" color="brand.400">← home</Text>
            <Text fontSize="lg" fontWeight="700" lineHeight="1.2">
              {user.toLowerCase() === owner.toLowerCase() ? `${data.name.split(" ")[0]}'s deployed lab` : `${user}'s deployed lab`}
            </Text>
          </Box>
        </Box>

        <div ref={frameRef} style={{
          position: "relative", height: "min(78dvh, 760px)", minHeight: 460, borderRadius: 14, overflow: "hidden",
          fontFamily: skin.font, border: "1px solid var(--border-strong)", boxShadow: "0 24px 70px rgba(0,0,0,.45)",
          background: "#000", isolation: "isolate",
        }}>
          <div style={{ position: "absolute", inset: 0, background: skin.wallpaper, filter: `hue-rotate(${hue}deg)`, transition: "filter .2s" }} />

          {/* desktop icons */}
          <div onPointerDown={() => setSelIcon("")} style={{
            position: "absolute", left: skin.left + 8, top: skin.top + 8, bottom: skin.bottom + 8, right: 8,
            display: "grid", gridAutoFlow: "column", gridTemplateRows: "repeat(auto-fill, 92px)", gridAutoColumns: "92px", justifyContent: "start",
            alignContent: "start", zIndex: 1,
          }}>
            {SYS_APPS.map((a) => iconBtn(a.kind, a.label, <SysIcon kind={a.kind} size={44} />, () => open(a.kind)))}
            {desktopRepos.map((r) => iconBtn(`p:${r.name}`, r.name, <AppIcon repo={r} size={44} />, () => open("project", r.name)))}
          </div>

          {lab.error && (
            <div style={{ position: "absolute", left: "50%", top: "42%", transform: "translateX(-50%)", zIndex: 2, background: "rgba(0,0,0,.7)", color: "#fff", padding: "12px 18px", borderRadius: 10, fontSize: 13, textAlign: "center" }}>
              {lab.error}<br />
              <button onClick={() => open("settings")} style={{ marginTop: 8, color: skin.accent, background: "none", border: "none", cursor: "pointer", font: "inherit" }}>open Settings</button>
            </div>
          )}

          {wins.map((w) => {
            const r = render(w);
            return (
              <Frame key={w.id} win={w} title={r.title} icon={r.icon} active={w.id === topId} compact={compact} area={area}
                onFocus={() => focus(w.id)} onChange={(p) => patch(w.id, p)} onClose={() => close(w.id)}>
                {r.body}
              </Frame>
            );
          })}

          {launcher && <Launcher onClose={() => setLauncher(false)} />}

          {/* ---- panels ---- */}
          {skin.key === "windows" && (
            <div style={{
              position: "absolute", left: 0, right: 0, bottom: 0, height: skin.bottom, background: skin.panelBg, backdropFilter: "blur(20px)",
              borderTop: `1px solid ${skin.border}`, display: "flex", alignItems: "center", padding: "0 10px", gap: 6, zIndex: 9000, color: skin.text,
            }}>
              <div style={{ flex: 1, display: "flex", justifyContent: compact ? "flex-start" : "center", gap: 4, overflow: "hidden" }}>
                <button onClick={() => setLauncher((v) => !v)} aria-label="Start" style={{ background: launcher ? "rgba(255,255,255,.15)" : "transparent", border: "none", cursor: "pointer", padding: "7px 11px", borderRadius: 6, color: skin.accent }}>
                  <FaWindows_ size={20} />
                </button>
                {winButtons}
              </div>
              <span style={{ fontSize: 12, whiteSpace: "nowrap" }}><Clock /></span>
            </div>
          )}

          {skin.key === "ubuntu" && (
            <>
              <div style={{
                position: "absolute", left: 0, right: 0, top: 0, height: skin.top, background: skin.panelBg, display: "flex", alignItems: "center",
                justifyContent: "space-between", padding: "0 12px", fontSize: 13, zIndex: 9000, color: skin.text,
              }}>
                <button onClick={() => setLauncher((v) => !v)} style={{ background: "transparent", border: "none", color: skin.text, cursor: "pointer", font: "inherit", fontWeight: 600 }}>Activities</button>
                <span><Clock /></span>
                <span style={{ color: skin.muted, fontSize: 12 }}>{user}</span>
              </div>
              <div style={{
                position: "absolute", left: 0, top: skin.top, bottom: 0, width: skin.left, background: skin.panelBg, display: "flex",
                flexDirection: "column", alignItems: "center", padding: "10px 0", gap: 8, zIndex: 9000, overflowY: "auto",
              }}>
                {SYS_APPS.map((a) => (
                  <button key={a.kind} title={a.label} onClick={() => open(a.kind)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    <SysIcon kind={a.kind} size={38} />
                  </button>
                ))}
                {wins.filter((w) => w.kind === "project").map((w) => {
                  const r = lab.repos.find((x) => x.name === w.repo);
                  return r ? (
                    <button key={w.id} title={r.name} onClick={() => toggleFromBar(w)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, borderLeft: `3px solid ${skin.accent}`, paddingLeft: 3 }}>
                      <AppIcon repo={r} size={36} />
                    </button>
                  ) : null;
                })}
                <div style={{ flex: 1 }} />
                <button title="Show applications" onClick={() => setLauncher((v) => !v)} style={{ background: "rgba(255,255,255,.15)", border: "none", cursor: "pointer", width: 38, height: 38, borderRadius: 10, color: "#fff", fontSize: 16 }}>⠿</button>
              </div>
            </>
          )}

          {skin.key === "debian" && (
            <>
              <div style={{
                position: "absolute", left: 0, right: 0, top: 0, height: skin.top, background: skin.panelBg, borderBottom: `1px solid ${skin.border}`,
                display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px", fontSize: 12, zIndex: 9000, color: skin.text,
              }}>
                <button onClick={() => setLauncher((v) => !v)} style={{ background: launcher ? "rgba(255,255,255,.12)" : "transparent", border: "none", color: skin.text, cursor: "pointer", font: "inherit", display: "flex", gap: 6, alignItems: "center", padding: "3px 8px", borderRadius: 3 }}>
                  <OsIcon size={13} style={{ color: skin.accent }} /> Applications ▾
                </button>
                <span><Clock /></span>
                <span style={{ color: skin.muted }}>{user}</span>
              </div>
              <div style={{
                position: "absolute", left: 0, right: 0, bottom: 0, height: skin.bottom, background: skin.panelBg, borderTop: `1px solid ${skin.border}`,
                display: "flex", alignItems: "center", gap: 4, padding: "0 6px", zIndex: 9000, overflow: "hidden",
              }}>{winButtons}</div>
            </>
          )}
        </div>

      </Box>
    </LabCtx.Provider>
  );
};

export default LabPage;
