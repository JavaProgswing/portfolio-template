import { Box, HStack, IconButton, Input, Stack, Text, Tooltip } from "@chakra-ui/react";
import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config";
import { unlock, getStats, ACHIEVEMENTS } from "../lib/achievements";
import { useKeystrokeSounds } from "../hooks/useKeystrokeSounds";
import { THEMES, applyTheme } from "../themes/palettes";
import { isFxMuted, setFxMuted } from "../lib/fx";
import { useFxMuted } from "../components/ThemeSwitcher";
import { CERTIFICATES } from "../components/Certificates";
import { slugify } from "../components/Blog";
import deployStatus from "../data/deploy-status.json";

type LineType = "input" | "output" | "error" | "banner";
interface Line { type: LineType; text: string }

const banner = (name: string) => {
  const title = `${name.split(" ")[0].toLowerCase()}'s shell · v2`;
  const w = Math.max(title.length, 30) + 4;
  const pad = (t: string) => `│  ${t.padEnd(w - 4)}  │`;
  return [`┌${"─".repeat(w)}┐`, pad(title), pad("type 'help' for commands"), `└${"─".repeat(w)}┘`].join("\n");
};

const GAMES: Record<string, string> = {
  snake: "/play/snake", "2048": "/play/2048", typing: "/play/typing", wordle: "/play/wordle", mines: "/play/mines", life: "/play/life",
};

const ROUTES: Record<string, string> = {
  home: "/", "/": "/", blog: "/blog", lab: "/lab", certificates: "/certificates", certs: "/certificates",
  now: "/now", colophon: "/colophon", console: "/console", guestbook: "/guestbook", resume: "/resume", cv: "/resume",
  play: "/play", games: "/play", ...GAMES,
};

const VFILES = ["about.txt", "projects.md", "skills.txt", "journey.md", "contact.txt", "resume.md", "secrets.txt"];

/** Live sites recorded by scripts/probe-deploys.mjs (own repos + standalone sites). */
const liveSites = () =>
  Object.entries(deployStatus as Record<string, { up: boolean; fork?: boolean; repo?: string }>)
    .filter(([, v]) => v.up && !v.fork)
    .map(([url, v]) => ({ url, name: v.repo || url }));

interface CmdContext {
  data: any;
  navigate: (path: string) => void;
  clear: () => void;
  history: string[];
}

const COMMANDS: Record<
  string,
  (ctx: CmdContext, args: string[]) => string | null | Promise<string | null>
> = {
  help: () => `about you
  about / whoami     bio
  skills             languages + frameworks
  journey            work + education
  projects           featured projects
  contact            social links
  cp                 competitive programming handles
  now                what i'm doing now
  neofetch           the classic

content
  blog               list posts        read <n>   open post n
  certs [hackathon|certification]      certificates and hackathon results
  sites              live deployments  (lab opens the desktop view)
  ls / cat <file>    virtual files

site
  open <page>        home, blog, lab, certs, resume, now, play, guestbook, colophon
  theme [name]       list or switch themes
  mute / unmute      theme sounds
  play [game]        snake, 2048, typing, wordle, mines, life (or type the game name)
  suggest <text>     send moderated feedback
  sign               go to the guestbook
  achievements       easter egg progress  (reset achievements to wipe)

shell
  history  man <cmd>  echo  date  pwd  clear  exit  sudo

↑/↓ history · tab completes commands and arguments · ctrl+l clears · ctrl+c cancels`,

  man: (_, args) => {
    const pages: Record<string, string> = {
      theme: "theme            list themes (current marked *)\ntheme <name>     switch, e.g. theme cyberpunk",
      read: "read <n>         open blog post n from `blog`\nread <words>     open the first post whose title matches",
      certs: "certs            everything, featured first\ncerts hackathon  hackathon results only\ncerts certification  courses only",
      open: `open <page>      one of: ${Object.keys(ROUTES).filter((r) => r !== "/").join(", ")}`,
      play: `play <game>      one of: ${Object.keys(GAMES).join(", ")}`,
    };
    const cmd = args[0];
    if (!cmd) return "usage: man <command>";
    return pages[cmd] || (COMMANDS[cmd] ? `${cmd}: no manual entry, but it exists. try it.` : `man: no entry for ${cmd}`);
  },

  about: ({ data }) =>
    `${data.name}\n${data.tags.join(" · ")}\n\n${data.desc}`,

  whoami: ({ data }) => `${data.name} · ${data.tags.join(" · ")}`,

  projects: ({ data }) =>
    `projects (${data.projects.length}):\n\n` +
    data.projects
      .map((p: any, i: number) =>
        `  ${String(i + 1).padStart(2, "0")}. ${p.name}\n      ${p.description}\n      [${p.skills.join(", ")}]`
      )
      .join("\n\n"),

  skills: ({ data }) =>
    `languages: ${data.languages.join(", ")}\n\n` +
    `frontend:  ${data.frameworks.frontend.map((f: any) => f.name).join(", ")}\n` +
    `backend:   ${data.frameworks.backend.map((f: any) => f.name).join(", ")}\n` +
    `databases: ${data.frameworks.databases.map((f: any) => f.name).join(", ")}\n` +
    `misc:      ${data.frameworks.misc.map((f: any) => f.name).join(", ")}`,

  journey: ({ data }) =>
    data.journey
      .map(
        (j: any) =>
          `[${j.date}]\n  ${j.title}\n  ${j.company}\n  ${j.description}`
      )
      .join("\n\n"),

  contact: ({ data }) =>
    "connect:\n\n" +
    data.contacts
      .map((c: any) => `  ${c.name.padEnd(12)} ${c.link}`)
      .join("\n"),

  blog: ({ data }) =>
    "writing:\n\n" +
    data.blogs
      .map(
        (b: any, i: number) =>
          `  ${i + 1}. "${b.title}"\n     ${b.date} · ${b.readTime}`
      )
      .join("\n\n"),

  now: ({ data }) => {
    const cw = data.currentWork;
    if (!cw) return "nothing configured. set currentWork in me.ts";
    return [
      `building: ${cw.title}${cw.org ? ` at ${cw.org}` : ""}${cw.startDate ? ` (since ${cw.startDate})` : ""}`,
      cw.description ? `  ${cw.description}` : "",
      cw.tags?.length ? `  tech: ${cw.tags.join(", ")}` : "",
    ].filter(Boolean).join("\n");
  },

  cp: ({ data }) =>
    data.cp ? Object.entries(data.cp).map(([k, v]) => `${(k + ":").padEnd(12)} ${v}`).join("\n") : "no handles configured (cp in me.ts)",

  ls: () => VFILES.join("   "),

  cat: ({ data }, args) => {
    const file = args[0];
    if (!file) return "usage: cat <file>";
    const files: Record<string, string> = {
      "about.txt": `${data.name}\n${data.tags.join(" · ")}\n\n${data.desc}`,
      "projects.md": COMMANDS.projects({ data } as CmdContext, []) as string,
      "skills.txt": COMMANDS.skills({ data } as CmdContext, []) as string,
      "journey.md": COMMANDS.journey({ data } as CmdContext, []) as string,
      "contact.txt": COMMANDS.contact({ data } as CmdContext, []) as string,
      "resume.md":
        `# ${data.name}\n\n${data.desc}\n\n## experience\n\n` +
        (COMMANDS.journey({ data } as CmdContext, []) as string) +
        "\n\n## skills\n\n" +
        (COMMANDS.skills({ data } as CmdContext, []) as string),
      "secrets.txt":
        "try the konami code: ↑↑↓↓←→←→ba\nor type 'matrix' / 'rainbow' anywhere on the site",
    };
    return files[file] || `cat: ${file}: no such file or directory`;
  },

  echo: (_, args) => args.join(" "),

  date: () => new Date().toString(),

  pwd: ({ data }) => `/home/${data.name.split(" ")[0].toLowerCase()}/portfolio`,

  open: ({ navigate }, args) => {
    const target = args[0];
    if (!target) return "usage: open <page>   (man open lists them)";
    const path = ROUTES[target.toLowerCase()];
    if (!path) return `open: unknown destination: ${target}`;
    setTimeout(() => navigate(path), 200);
    return `→ navigating to ${path}…`;
  },

  exit: ({ navigate }) => {
    setTimeout(() => navigate("/"), 200);
    return "goodbye.";
  },

  sudo: () =>
    "[sudo] password for visitor:\n[sudo] password for visitor:\n[sudo] password for visitor:\nsudo: 3 incorrect password attempts",

  rm: (_, args) =>
    args.includes("-rf") && args.includes("/")
      ? "nice try."
      : `rm: cannot remove '${args.join(" ")}': permission denied`,

  whois: ({ data }) => data.contacts.find((c: any) => c.id === "github")?.link || "n/a",

  play: ({ navigate }, args) => {
    const game = args[0]?.toLowerCase();
    const list = Object.keys(GAMES).join(", ");
    if (game && GAMES[game]) {
      setTimeout(() => navigate(GAMES[game]), 200);
      return `→ launching ${game}…`;
    }
    if (game) return `play: unknown game '${game}'\navailable: ${list}`;
    setTimeout(() => navigate("/play"), 200);
    return `→ opening game selector…\n\navailable: ${list}`;
  },

  ...Object.fromEntries(
    Object.keys(GAMES).map((g) => [g, (ctx: CmdContext) => COMMANDS.play(ctx, [g])])
  ),

  suggest: async (_, args) => {
    const message = args.join(" ").trim();
    if (!message) return "usage: suggest <your feedback or idea>";
    if (message.length < 3) return "suggestion too short";
    try {
      const res = await fetch(`${API_BASE}/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "console-visitor", message }),
      });
      if (!res.ok) return `suggest: backend returned ${res.status}`;
      // Track in achievements (unlock is statically imported above)
      unlock("suggester");
      return "✓ suggestion received · moderated before publishing · thanks!";
    } catch {
      return "suggest: backend unreachable. is portfolio-api running?";
    }
  },

  sign: ({ navigate }) => {
    setTimeout(() => navigate("/guestbook"), 200);
    return "→ heading to guestbook…";
  },

  wander: ({ navigate }) => {
    // Intentional 404 navigation - unlocks Wanderer
    const paths = ["/void", "/lost", "/elsewhere", "/the-edge", "/here-be-dragons"];
    const path = paths[Math.floor(Math.random() * paths.length)];
    setTimeout(() => navigate(path), 200);
    return `→ wandering off the map → ${path}\n  (any unknown URL works — try /typewhatever)`;
  },

  reset: (_, args) => {
    if (args[0] === "achievements") {
      try {
        localStorage.removeItem("portfolio-achievements");
        localStorage.removeItem("portfolio-themes-tried");
        return "✓ achievements reset — refresh page to start fresh";
      } catch {
        return "reset: localStorage unavailable";
      }
    }
    return "usage: reset achievements\n  wipes localStorage achievement progress";
  },

  read: ({ data, navigate }, args) => {
    const blogs: any[] = data.blogs || [];
    if (!args.length) return "usage: read <n>   (see `blog`)";
    const n = Number(args[0]);
    const q = args.join(" ").toLowerCase();
    const post = Number.isInteger(n) && n > 0 ? blogs[n - 1] : blogs.find((b) => b.title.toLowerCase().includes(q));
    if (!post) return `read: no post matching '${args.join(" ")}'`;
    if (!post.content && post.link) { window.open(post.link, "_blank", "noopener"); return `→ opening ${post.link}`; }
    setTimeout(() => navigate(`/blog/${slugify(post.title)}`), 200);
    return `→ opening "${post.title}"…`;
  },

  certs: (_, args) => {
    const kind = args[0]?.toLowerCase();
    const list = CERTIFICATES
      .filter((c) => !kind || c.category.startsWith(kind.replace(/s$/, "")))
      .sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || b.date.localeCompare(a.date));
    if (!list.length) return kind ? `certs: nothing in '${kind}'` : "no certificates configured (src/data/certificates.json)";
    return list
      .map((c) => `  ${c.category === "hackathon" ? "🏆" : "✓"} ${c.title}${c.result ? `  [${c.result}]` : ""}\n     ${c.issuer} · ${c.date}${c.file ? `\n     ${window.location.origin}${c.file}` : ""}`)
      .join("\n\n") + "\n\nopen certs  → full page";
  },

  sites: () => {
    const sites = liveSites();
    if (!sites.length) return "no live sites recorded. run npm run probe-deploys";
    return `live (${sites.length}):\n\n` + sites.map((s) => `  ● ${s.name.padEnd(26)} ${s.url}`).join("\n") + "\n\nopen lab  → desktop view";
  },

  theme: (_, args) => {
    const current = document.body.dataset.theme;
    if (!args[0]) {
      return THEMES.map((t) => `  ${t.key === current ? "*" : " "} ${t.key.padEnd(12)} ${t.desc}`).join("\n") + "\n\nusage: theme <name>";
    }
    const key = args[0].toLowerCase();
    const t = THEMES.find((x) => x.key === key || x.name.toLowerCase() === key);
    if (!t) return `theme: unknown theme '${args[0]}'`;
    applyTheme(t.key, true);
    return `✓ theme → ${t.name}`;
  },

  mute: () => { setFxMuted(true); return "🔇 theme sounds muted"; },
  unmute: () => { setFxMuted(false); return "🔊 theme sounds on"; },

  history: ({ history }) =>
    history.length ? history.map((h, i) => `  ${String(i + 1).padStart(3)}  ${h}`).join("\n") : "(empty)",

  neofetch: ({ data }) => {
    const user = data.name.split(" ")[0].toLowerCase();
    const host = window.location.hostname || "localhost";
    const theme = THEMES.find((t) => t.key === document.body.dataset.theme)?.name || "default";
    const art = ["   ▄▄▄▄▄▄▄   ", "  █ ▄▄▄▄▄ █  ", "  █ █   █ █  ", "  █ █▄▄▄█ █  ", "  █▄▄▄▄▄▄▄█  ", "    ▀▀▀▀▀    "];
    const info = [
      `${user}@${host}`,
      "─".repeat(user.length + host.length + 1),
      `name:    ${data.name}`,
      `role:    ${(data.tags || []).slice(0, 2).join(", ")}`,
      `stack:   ${(data.languages || []).slice(0, 4).join(", ")}`,
      `theme:   ${theme}${isFxMuted() ? " (muted)" : ""}`,
      `posts:   ${(data.blogs || []).length}   sites: ${liveSites().length}   certs: ${CERTIFICATES.length}`,
      `uptime:  ${Math.round(performance.now() / 60000)} min on this page`,
    ];
    return info.map((l, i) => `${art[i] || " ".repeat(13)}  ${l}`).join("\n");
  },

  achievements: () => {
    const stats = getStats();
    if (stats.found === 0) {
      return "no achievements yet.\n\nhint: try keyboard shortcuts (press ? on any page), type some random words,\nor press the konami code somewhere.";
    }
    const lines = ACHIEVEMENTS.map((a) => {
      const got = stats.unlocked.has(a.key);
      return got ? `  ✓ ${a.label.padEnd(22)} ${a.hint}` : `  ◌ ${a.label.padEnd(22)} ???`;
    });
    return `progress: ${stats.found}/${stats.total} found\n\n${lines.join("\n")}`;
  },
};

const ConsolePage = ({ data }: { data: any }) => {
  const navigate = useNavigate();
  const [lines, setLines] = useState<Line[]>([
    { type: "banner", text: banner(data.name) },
    { type: "output", text: "type 'help' to begin." },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const soundMuted = useFxMuted();
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const { playKeystroke } = useKeystrokeSounds({ volume: 0.45, muted: soundMuted });

  useEffect(() => {
    inputRef.current?.focus();
    unlock("console");
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [lines]);

  const focusInput = () => inputRef.current?.focus();

  const prompt = `${data.name.split(" ")[0].toLowerCase()}@${window.location.hostname || "localhost"}:~$`;

  /** Completion candidates for the argument of a given command. */
  const argOptions = (cmd: string): string[] => {
    switch (cmd) {
      case "open": return Object.keys(ROUTES).filter((r) => r !== "/");
      case "play": return Object.keys(GAMES);
      case "theme": return THEMES.map((t) => t.key);
      case "cat": return VFILES;
      case "certs": return ["hackathon", "certification"];
      case "man": return Object.keys(COMMANDS);
      case "read": return (data.blogs || []).map((_: unknown, i: number) => String(i + 1));
      case "reset": return ["achievements"];
      default: return [];
    }
  };

  const clear = () => setLines([]);

  const runCommand = (raw: string) => {
    const trimmed = raw.trim();
    setLines((l) => [...l, { type: "input", text: `${prompt} ${raw}` }]);
    if (!trimmed) return;

    setHistory((h) => [...h, trimmed]);
    setHistoryIdx(-1);

    const [cmd, ...args] = trimmed.split(/\s+/);
    const lower = cmd.toLowerCase();

    if (lower === "clear" || lower === "cls") {
      clear();
      return;
    }

    const fn = COMMANDS[lower];
    if (!fn) {
      setLines((l) => [
        ...l,
        { type: "error", text: `command not found: ${cmd}\ntype 'help' for available commands` },
      ]);
      return;
    }

    try {
      const result = fn({ data, navigate, clear, history: [...history, trimmed] }, args);
      // Support both sync (string|null) and async (Promise<string|null>) commands
      if (result && typeof (result as Promise<unknown>).then === "function") {
        setLines((l) => [...l, { type: "output", text: "…" }]);
        (result as Promise<string | null>)
          .then((out) => {
            setLines((l) => {
              const copy = [...l];
              copy[copy.length - 1] = { type: "output", text: out ?? "" };
              return copy;
            });
          })
          .catch((e) => {
            setLines((l) => {
              const copy = [...l];
              copy[copy.length - 1] = { type: "error", text: `error: ${e.message}` };
              return copy;
            });
          });
      } else if (result !== null) {
        setLines((l) => [...l, { type: "output", text: result as string }]);
      }
    } catch (e) {
      setLines((l) => [...l, { type: "error", text: `error: ${(e as Error).message}` }]);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Play keystroke sound for every key
    playKeystroke(e.key);

    if (e.key === "Enter") {
      e.preventDefault();
      runCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const idx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(idx);
      setInput(history[idx] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx === -1) return;
      if (historyIdx >= history.length - 1) {
        setHistoryIdx(-1);
        setInput("");
      } else {
        const idx = historyIdx + 1;
        setHistoryIdx(idx);
        setInput(history[idx]);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const parts = input.split(/\s+/);
      const completingArg = parts.length > 1;
      const word = (completingArg ? parts[parts.length - 1] : parts[0]).toLowerCase();
      const pool = completingArg ? argOptions(parts[0].toLowerCase()) : Object.keys(COMMANDS);
      const hits = pool.filter((c) => c.toLowerCase().startsWith(word));
      if (hits.length === 1) {
        setInput(completingArg ? [...parts.slice(0, -1), hits[0]].join(" ") + " " : hits[0] + " ");
      } else if (hits.length > 1) {
        setLines((l) => [...l, { type: "output", text: hits.join("  ") }]);
      }
    } else if (e.key === "c" && e.ctrlKey && !window.getSelection()?.toString()) {
      e.preventDefault();
      setLines((l) => [...l, { type: "input", text: `${prompt} ${input}^C` }]);
      setInput("");
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      clear();
    }
  };

  const lineColor: Record<LineType, string> = {
    input: "fg.strong",
    output: "fg.body",
    error: "red.400",
    banner: "brand.400",
  };

  return (
    <Box
      maxW="900px"
      mx="auto"
      px={{ base: 4, md: 6 }}
      py={10}
      minH="calc(100dvh - 60px)"
      onClick={focusInput}
      cursor="text"
      position="relative"
    >
      {/* Sound toggle */}
      <Tooltip label={soundMuted ? "Unmute sounds" : "Mute sounds"} placement="left">
        <IconButton
          aria-label={soundMuted ? "Unmute keystroke sounds" : "Mute keystroke sounds"}
          onClick={(e) => {
            e.stopPropagation();
            setFxMuted(!soundMuted);
          }}
          position="absolute"
          top={3}
          right={3}
          size="sm"
          variant="ghost"
          color={soundMuted ? "gray.500" : "brand.400"}
          _hover={{ bg: "whiteAlpha.100" }}
          fontSize="16px"
        >
          {soundMuted ? "🔇" : "🔊"}
        </IconButton>
      </Tooltip>
      <Stack spacing={1} fontFamily="mono" fontSize="13px">
        {lines.map((l, i) => (
          <Text
            key={i}
            color={lineColor[l.type]}
            whiteSpace="pre-wrap"
            lineHeight="1.6"
            fontFamily="mono"
          >
            {l.text}
          </Text>
        ))}
        <HStack spacing={2} pt={1}>
          <Text color="brand.400" fontFamily="mono" fontWeight="600" whiteSpace="nowrap">
            {prompt}
          </Text>
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            variant="unstyled"
            color="fg.strong"
            fontFamily="mono"
            fontSize="13px"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </HStack>
        <div ref={endRef} />
      </Stack>
    </Box>
  );
};

export default ConsolePage;
