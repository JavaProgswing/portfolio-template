import { Box, HStack, Input, Stack, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { unlock, getStats, ACHIEVEMENTS } from "../lib/achievements";

type LineType = "input" | "output" | "error" | "banner";
interface Line { type: LineType; text: string }

const BANNER = `┌─────────────────────────────────────────┐
│  portfolio shell  ·  v1.0               │
│  type 'help' for commands               │
└─────────────────────────────────────────┘`;

interface CmdContext {
  data: any;
  navigate: (path: string) => void;
  clear: () => void;
}

const COMMANDS: Record<
  string,
  (ctx: CmdContext, args: string[]) => string | null | Promise<string | null>
> = {
  help: () => `available commands:

  about      - bio
  whoami     - same
  projects   - all projects
  skills     - languages + frameworks
  journey    - work + education
  contact    - social links
  blog       - blog post titles
  cp         - competitive programming handles
  now        - what i'm doing now
  ls         - virtual files
  cat <file> - read a virtual file
  achievements - your easter egg progress

  play [game] - mini-games selector or launch direct
              available games: snake, 2048, typing
  snake      - launch snake directly
  2048       - launch 2048 directly
  typing     - launch type:race directly
  suggest <text> - send moderated feedback
  sign       - go to guestbook
  wander     - navigate to a 404 path (unlocks Wanderer)
  reset achievements - wipe progress to test unlocks fresh
  echo <txt> - print text
  date       - current date
  pwd        - working directory
  open <id>  - navigate (home, uses, now, colophon, console, /)
  clear      - clear screen
  exit       - back to portfolio
  sudo       - try it

press ↑/↓ for command history`,

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

  cp: ({ data }) =>
    `codeforces: ${data.cp.codeforces}\nleetcode:   ${data.cp.leetcode}`,

  now: ({ data }) => {
    const cw = data.currentWork;
    return `building: ${cw.title} at ${cw.org} (since ${cw.startDate})\n  ${cw.description}\n  tech: ${cw.tags.join(", ")}`;
  },

  ls: () =>
    "about.txt   projects.md   skills.txt   journey.md   contact.txt   resume.md   secrets.txt",

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
    if (!target) return "usage: open <home|uses|now|colophon|console|/>";
    const routes: Record<string, string> = {
      home: "/",
      "/": "/",
      uses: "/uses",
      now: "/now",
      colophon: "/colophon",
      console: "/console",
      guestbook: "/guestbook",
      resume: "/resume",
      cv: "/resume",
      play: "/play",
      games: "/play",
      snake: "/play/snake",
      "2048": "/play/2048",
      typing: "/play/typing",
      type: "/play/typing",
    };
    const path = routes[target.toLowerCase()];
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
    const routes: Record<string, string> = {
      snake: "/play/snake",
      "2048": "/play/2048",
      typing: "/play/typing",
      type: "/play/typing",
    };
    if (game && routes[game]) {
      setTimeout(() => navigate(routes[game]), 200);
      return `→ launching ${game}…`;
    }
    if (game) return `play: unknown game '${game}'\navailable: snake, 2048, typing`;
    setTimeout(() => navigate("/play"), 200);
    return "→ opening game selector…\n\navailable: snake, 2048, typing\nuse 'play snake' to launch directly";
  },

  snake: ({ navigate }) => {
    setTimeout(() => navigate("/play/snake"), 200);
    return "→ launching snake…";
  },

  "2048": ({ navigate }) => {
    setTimeout(() => navigate("/play/2048"), 200);
    return "→ launching 2048…";
  },

  typing: ({ navigate }) => {
    setTimeout(() => navigate("/play/typing"), 200);
    return "→ launching type:race…";
  },

  suggest: async (_, args) => {
    const message = args.join(" ").trim();
    if (!message) return "usage: suggest <your feedback or idea>";
    if (message.length < 3) return "suggestion too short";
    try {
      const res = await fetch("/api/portfolio/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "console-visitor", message }),
      });
      if (!res.ok) return `suggest: backend returned ${res.status}`;
      // Track in achievements
      import("../lib/achievements").then(({ unlock }) => unlock("suggester"));
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
    // Intentional 404 navigation — unlocks Wanderer
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
    { type: "banner", text: BANNER },
    { type: "output", text: "type 'help' to begin." },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    unlock("console");
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [lines]);

  const focusInput = () => inputRef.current?.focus();

  const clear = () => setLines([]);

  const runCommand = (raw: string) => {
    const trimmed = raw.trim();
    setLines((l) => [...l, { type: "input", text: `❯ ${raw}` }]);
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
      const result = fn({ data, navigate, clear }, args);
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
      const cmds = Object.keys(COMMANDS).filter((c) => c.startsWith(input.toLowerCase()));
      if (cmds.length === 1) setInput(cmds[0]);
      else if (cmds.length > 1)
        setLines((l) => [...l, { type: "output", text: cmds.join("  ") }]);
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      clear();
    }
  };

  const lineColor: Record<LineType, string> = {
    input: "gray.100",
    output: "gray.300",
    error: "red.400",
    banner: "brand.400",
  };

  return (
    <Box
      maxW="900px"
      mx="auto"
      px={{ base: 4, md: 6 }}
      py={10}
      minH="calc(100vh - 60px)"
      onClick={focusInput}
      cursor="text"
    >
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
          <Text color="brand.400" fontFamily="mono" fontWeight="600">
            ❯
          </Text>
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            variant="unstyled"
            color="gray.100"
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
