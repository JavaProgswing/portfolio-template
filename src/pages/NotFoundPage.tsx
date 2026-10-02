import { Box, Button, Heading, HStack, Input, Text } from "@chakra-ui/react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { unlock } from "../lib/achievements";
import { BlogPost, slugify } from "../components/Blog";

const MotionBox = motion(Box);

const TAGLINES = [
  "this URL doesn't exist in any timeline",
  "the page is on vacation. without WiFi.",
  "you broke the matrix. quietly.",
  "page.exe has stopped responding",
  "lost between commits",
  "the cake was a lie",
  "this is fine. (it's not.)",
];

const GLITCH = "█▓▒░╳◢◣◤◥▌▐▀▄";
const rand = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

const ROUTES: { to: string; label: string; hint: string }[] = [
  { to: "/", label: "home", hint: "the front door" },
  { to: "/blog", label: "blog", hint: "write-ups and notes" },
  { to: "/lab", label: "lab", hint: "deployed projects, on a desktop" },
  { to: "/certificates", label: "certificates", hint: "hackathons and certifications" },
  { to: "/now", label: "now", hint: "what I'm doing" },
  { to: "/resume", label: "resume", hint: "the CV" },
  { to: "/play", label: "play", hint: "mini-games" },
  { to: "/console", label: "console", hint: "interactive terminal" },
  { to: "/guestbook", label: "guestbook", hint: "sign the wall" },
  { to: "/colophon", label: "colophon", hint: "how this was built" },
];

// Plain Levenshtein; the route list is tiny so no need to be clever.
const dist = (a: string, b: string) => {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
};

const NotFoundPage = ({ blogs = [] }: { blogs?: BlogPost[] }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [digits, setDigits] = useState("404");
  const [tagline] = useState(() => TAGLINES[rand(0, TAGLINES.length - 1)]);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 20 });
  const sy = useSpring(my, { stiffness: 120, damping: 20 });
  const tx = useTransform(sx, [-1, 1], [-14, 14]);
  const ty = useTransform(sy, [-1, 1], [-10, 10]);

  useEffect(() => { unlock("got-404"); }, []);

  // scramble in, then an occasional single-digit glitch
  useEffect(() => {
    let n = 0;
    const scramble = setInterval(() => {
      n++;
      if (n > 10) { clearInterval(scramble); setDigits("404"); return; }
      setDigits(Array.from({ length: 3 }, () => (Math.random() < 0.4 ? GLITCH[rand(0, GLITCH.length - 1)] : String(rand(0, 9)))).join(""));
    }, 60);
    const flicker = setInterval(() => {
      if (Math.random() < 0.25) {
        const i = rand(0, 2);
        setDigits("404".slice(0, i) + GLITCH[rand(0, GLITCH.length - 1)] + "404".slice(i + 1));
        setTimeout(() => setDigits("404"), 80);
      }
    }, 1800);
    return () => { clearInterval(scramble); clearInterval(flicker); };
  }, []);

  const asked = location.pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
  const suggestions = useMemo(() => {
    const word = asked.split("/")[0];
    return [...ROUTES]
      .map((r) => {
        const name = r.label;
        const score = word && (name.includes(word) || word.includes(name)) ? 0 : dist(word, name);
        return { r, score };
      })
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map((x) => x.r);
  }, [asked]);

  const go = (e: FormEvent) => {
    e.preventDefault();
    const n = q.trim().toLowerCase();
    if (!n) return;
    const hit = ROUTES.find((r) => r.label === n || r.to === n) || ROUTES.find((r) => r.label.startsWith(n));
    if (hit) { navigate(hit.to); return; }
    const post = blogs.find((b) => b.title.toLowerCase().includes(n) || b.tags.some((t) => t.toLowerCase() === n));
    navigate(post ? `/blog/${slugify(post.title)}` : `/blog`);
  };

  return (
    <Box
      ref={ref}
      position="relative" overflow="hidden" minH="calc(100dvh - 54px)"
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect(); if (!r) return;
        mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
        my.set(((e.clientY - r.top) / r.height) * 2 - 1);
      }}
    >
      {/* drifting orbs */}
      {[0, 1, 2].map((i) => (
        <MotionBox
          key={i} position="absolute" borderRadius="full" filter="blur(70px)" opacity={0.28} pointerEvents="none"
          bg={i === 1 ? "brand.500" : "brand.400"}
          w={["340px", "420px", "300px"][i]} h={["340px", "420px", "300px"][i]}
          style={{ top: ["8%", "45%", "-6%"][i], left: ["6%", "62%", "55%"][i] }}
          animate={{ x: [0, 40, -30, 0], y: [0, -30, 30, 0] }}
          transition={{ duration: 14 + i * 4, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      <Box position="relative" maxW="720px" mx="auto" px={{ base: 5, md: 8 }} py={{ base: 12, md: 20 }} textAlign="center">
        <MotionBox style={{ x: tx, y: ty }}>
          <Text fontFamily="mono" fontSize="11px" color="gray.500" letterSpacing="0.2em" textTransform="uppercase" mb={2}>
            error · page not found
          </Text>
          <Heading
            className="grad-text" fontFamily="mono" fontWeight="800" lineHeight="1" letterSpacing="-0.04em"
            fontSize={{ base: "96px", md: "164px" }} userSelect="none"
          >
            {digits}
          </Heading>
        </MotionBox>

        <MotionBox initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }}>
          <Text fontSize="lg" mt={4} color="fg.body">{tagline}</Text>
          <Text fontFamily="mono" fontSize="12px" color="gray.500" mt={2}>
            nothing lives at <Text as="span" color="brand.400">/{asked}</Text>
          </Text>

          <Box mt={9} textAlign="left" p={4} borderRadius="12px" layerStyle="card">
            <Text fontFamily="mono" fontSize="11px" color="gray.500" mb={2}>
              $ did-you-mean {asked.split("/")[0] || "?"}
            </Text>
            <Box display="grid" gridTemplateColumns={{ base: "1fr", sm: "repeat(3, 1fr)" }} gap={2}>
              {suggestions.map((s) => (
                <Box key={s.to} as={RouterLink} to={s.to} className="lift" p={3} borderRadius="10px" bg="var(--surface-strong)" border="1px solid var(--border)">
                  <Text fontFamily="mono" fontSize="13px" color="brand.400" fontWeight="600">{s.to}</Text>
                  <Text fontSize="11px" color="gray.500">{s.hint}</Text>
                </Box>
              ))}
            </Box>
          </Box>

          <form onSubmit={go}>
            <HStack mt={4}>
              <Input
                value={q} onChange={(e) => setQ(e.target.value)} placeholder="or type a page, post title or tag…"
                fontFamily="mono" fontSize="13px" variant="filled" borderRadius="10px" bg="var(--surface)"
                _hover={{ bg: "var(--surface-strong)" }}
              />
              <Button type="submit" variant="glow" fontFamily="mono" fontSize="12px" px={6}>go</Button>
            </HStack>
          </form>

          {blogs.length > 0 && (
            <Box mt={8} textAlign="left">
              <Text fontFamily="mono" fontSize="10px" color="gray.500" letterSpacing="0.14em" textTransform="uppercase" mb={2}>
                or read something while you're here
              </Text>
              {blogs.slice(0, 3).map((b) => (
                <Box key={b.title} as={RouterLink} to={`/blog/${slugify(b.title)}`} display="block" py={2} borderBottom="1px solid var(--border)"
                  _hover={{ textDecoration: "none", color: "brand.400" }}>
                  <Text fontSize="sm" color="inherit" noOfLines={1}>{b.title}</Text>
                </Box>
              ))}
            </Box>
          )}

          <HStack justify="center" mt={9} spacing={3}>
            <Button as={RouterLink} to="/" variant="glow" size="sm" fontFamily="mono" fontSize="12px">↵ go home</Button>
            <Button as={RouterLink} to="/console" size="sm" variant="ghost" fontFamily="mono" fontSize="12px">console</Button>
          </HStack>
        </MotionBox>
      </Box>
    </Box>
  );
};

export default NotFoundPage;
