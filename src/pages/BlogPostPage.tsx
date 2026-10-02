import {
  Avatar, Box, Button, Divider, Flex, Heading, HStack, Icon, Tag, Text, Wrap, WrapItem, useToast,
} from "@chakra-ui/react";
import { ElementType, Fragment, ReactNode, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FaArrowUp, FaCheck, FaCopy, FaLink, FaShareAlt } from "react-icons/fa";
import { BlogPost, slugify, RatingBar, CommentsSection } from "../components/Blog";

const MotionBox = motion(Box);

/** Inline: `code`, **bold**, *italic*, [text](url). Anything else stays plain text. */
const inline = (text: string): ReactNode[] => {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)|(\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("`")) {
      out.push(
        <Box as="code" key={k++} px={1.5} py="1px" borderRadius="5px" fontFamily="mono" fontSize="0.88em"
          bg="var(--surface-strong)" border="1px solid var(--border)" color="brand.300">
          {t.slice(1, -1)}
        </Box>
      );
    } else if (t.startsWith("**")) {
      out.push(<strong key={k++}>{t.slice(2, -2)}</strong>);
    } else if (t.startsWith("*")) {
      out.push(<em key={k++}>{t.slice(1, -1)}</em>);
    } else {
      const lm = t.match(/\[([^\]]+)\]\(([^)]+)\)/)!;
      out.push(
        <Box as="a" key={k++} href={lm[2]} target="_blank" rel="noopener noreferrer" color="brand.400"
          textDecoration="underline" textUnderlineOffset="3px" _hover={{ color: "brand.300" }}>
          {lm[1]}
        </Box>
      );
    }
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
};

const CodeBlock = ({ code }: { code: string }) => {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* clipboard blocked */ }
  };
  return (
    <Box borderRadius="12px" overflow="hidden" border="1px solid var(--border)" bg="var(--surface-strong)">
      <Flex align="center" justify="space-between" px={3} py={1.5} borderBottom="1px solid var(--border)">
        <HStack spacing={1.5}>
          {["#f87171", "#fbbf24", "#34d399"].map((c) => <Box key={c} w="9px" h="9px" borderRadius="full" bg={c} opacity={0.8} />)}
        </HStack>
        <Button size="xs" variant="ghost" fontFamily="mono" fontSize="10px" onClick={copy}
          leftIcon={<Icon as={(done ? FaCheck : FaCopy) as ElementType} boxSize={2.5} />}>
          {done ? "copied" : "copy"}
        </Button>
      </Flex>
      <Box as="pre" p={4} m={0} fontFamily="mono" fontSize="12.5px" lineHeight="1.75" overflowX="auto" whiteSpace="pre">{code}</Box>
    </Box>
  );
};

const Body = ({ text }: { text: string }) => {
  const paras = text.split("\n\n");
  let firstProse = true;
  return (
    <Flex direction="column" gap={6} fontSize={{ base: "16px", md: "17px" }}>
      {paras.map((para, i) => {
        if (para.startsWith("> ")) {
          return (
            <Box key={i} borderLeft="3px solid" borderColor="brand.500" pl={5} py={1} bg="rgba(var(--brand-rgb),0.05)" borderRadius="0 10px 10px 0">
              <Text color="fg.body" fontStyle="italic" lineHeight="1.9">{inline(para.slice(2))}</Text>
            </Box>
          );
        }
        if (para.startsWith("## ")) {
          const title = para.slice(3);
          return <Heading key={i} id={slugify(title)} as="h2" size="lg" mt={6} scrollMarginTop="80px">{title}</Heading>;
        }
        if (/^ {2,}\S/.test(para)) {
          return <CodeBlock key={i} code={para.replace(/^ {2}/gm, "")} />;
        }
        const drop = firstProse;
        firstProse = false;
        return (
          <Text key={i} color="fg.body" lineHeight="1.95" whiteSpace="pre-wrap"
            sx={drop ? {
              "&::first-letter": {
                float: "left", fontSize: "3.4em", lineHeight: 0.85, fontWeight: 800, paddingRight: "10px", paddingTop: "4px",
                color: "var(--chakra-colors-brand-400)",
              },
            } : undefined}>
            {inline(para)}
          </Text>
        );
      })}
    </Flex>
  );
};

const Ring = ({ pct, onClick }: { pct: number; onClick: () => void }) => {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <Box as="button" aria-label="Back to top" onClick={onClick} position="relative" w="46px" h="46px" borderRadius="full"
      bg="var(--bg-base)" border="1px solid var(--border-strong)" boxShadow="0 6px 20px rgba(0,0,0,.35)" className="lift">
      <svg width="46" height="46" viewBox="0 0 46 46" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx="23" cy="23" r={r} fill="none" stroke="var(--border)" strokeWidth="3" />
        <circle cx="23" cy="23" r={r} fill="none" stroke="var(--chakra-colors-brand-400)" strokeWidth="3" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ transition: "stroke-dashoffset .1s linear" }} />
      </svg>
      <Icon as={FaArrowUp as ElementType} boxSize={3} position="absolute" top="50%" left="50%" transform="translate(-50%,-50%)" color="brand.400" />
    </Box>
  );
};

const mins = (rt: string) => parseInt(rt, 10) || 5;

const BlogPostPage = ({ blogs }: { blogs: BlogPost[] }) => {
  const { slug } = useParams();
  const toast = useToast();
  const idx = blogs.findIndex((b) => slugify(b.title) === slug);
  const post = blogs[idx];
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [slug]);

  useEffect(() => {
    if (!post) return;
    const prev = document.title;
    document.title = `${post.title} · Blog`;
    return () => { document.title = prev; };
  }, [post]);

  const related = useMemo(() => {
    if (!post) return [];
    return blogs
      .filter((b) => b !== post)
      .map((b) => ({ b, n: b.tags.filter((t) => post.tags.includes(t)).length }))
      .filter((x) => x.n > 0)
      .sort((a, b) => b.n - a.n)
      .slice(0, 2)
      .map((x) => x.b);
  }, [blogs, post]);

  const headings = useMemo(
    () => (post?.content || "").split("\n\n").filter((p) => p.startsWith("## ")).map((p) => p.slice(3)),
    [post]
  );

  if (!post) {
    return (
      <Box maxW="720px" mx="auto" px={6} py={24} textAlign="center">
        <Heading size="lg" mb={3}>Post not found</Heading>
        <Text color="gray.500" mb={6}>That slug doesn't match any post.</Text>
        <Button as={RouterLink} to="/blog" variant="glow" size="sm">← all posts</Button>
      </Box>
    );
  }

  const url = typeof window !== "undefined" ? window.location.href : "";
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", status: "success", duration: 1800, position: "bottom-left", variant: "subtle" });
    } catch { /* clipboard blocked */ }
  };
  const share = () => {
    if (navigator.share) navigator.share({ title: post.title, url }).catch(() => undefined);
    else copyLink();
  };
  const left = Math.max(0, Math.ceil(mins(post.readTime) * (1 - progress / 100)));

  const nav = (p: BlogPost, label: string) => {
    const props: any = p.content
      ? { as: RouterLink, to: `/blog/${slugify(p.title)}` }
      : { as: "a", href: p.link, target: "_blank", rel: "noopener noreferrer" };
    return (
      <Box {...props} flex="1 1 260px" p={4} borderRadius="12px" layerStyle="card" className="lift">
        <Text fontSize="10px" fontFamily="mono" color="gray.500" textTransform="uppercase" letterSpacing="0.12em">{label}</Text>
        <Text fontSize="sm" fontWeight="600" mt={1} noOfLines={2}>{p.title}</Text>
      </Box>
    );
  };
  const newer = blogs[idx - 1];
  const older = blogs[idx + 1];

  return (
    <MotionBox key={slug} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* floating rail (wide screens) */}
      <Box position="fixed" right={{ base: 3, md: 6 }} bottom={{ base: 20, md: 8 }} zIndex={150} display={progress > 3 ? "flex" : "none"} flexDirection="column" gap={2} alignItems="center">
        <Text fontFamily="mono" fontSize="10px" color="gray.500" textAlign="center">
          {left > 0 ? `${left}m left` : "done"}
        </Text>
        <Ring pct={progress} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
      </Box>

      <Box maxW="1040px" mx="auto" px={{ base: 5, md: 8 }} pt={{ base: 10, md: 16 }} pb={20}>
        <Text as={RouterLink} to="/blog" fontSize="11px" color="brand.400" fontFamily="mono" display="inline-block" mb={8}>
          ← all posts
        </Text>

        {/* header */}
        <Box maxW="760px" mb={10}>
          <Wrap spacing={2} mb={5}>
            {post.tags.map((t) => (
              <WrapItem key={t}><Tag size="sm" colorScheme="purple" variant="subtle">{t}</Tag></WrapItem>
            ))}
          </Wrap>
          <Heading as="h1" fontSize={{ base: "3xl", md: "5xl" }} lineHeight="1.12" mb={5} className="grad-text">
            {post.title}
          </Heading>
          <Text fontSize={{ base: "md", md: "xl" }} color="fg.muted" lineHeight="1.7" mb={6}>{post.excerpt}</Text>
          <Flex align="center" justify="space-between" gap={4} wrap="wrap" py={4} borderY="1px solid var(--border)">
            <HStack spacing={3}>
              <Avatar size="sm" name={post.authors?.[0] || "Author"} bg="brand.500" color="white" />
              <Box>
                <Text fontSize="sm" fontWeight="600" lineHeight="1.2">{post.authors?.join(", ") || "Anonymous"}</Text>
                <Text fontFamily="mono" fontSize="11px" color="gray.500">{post.date} · {post.readTime}</Text>
              </Box>
            </HStack>
            <HStack spacing={1}>
              <Button size="sm" variant="ghost" leftIcon={<Icon as={FaLink as ElementType} boxSize={3} />} fontFamily="mono" fontSize="11px" onClick={copyLink}>copy link</Button>
              <Button size="sm" variant="ghost" leftIcon={<Icon as={FaShareAlt as ElementType} boxSize={3} />} fontFamily="mono" fontSize="11px" onClick={share}>share</Button>
            </HStack>
          </Flex>
        </Box>

        <Flex gap={12} align="flex-start">
          <Box flex={1} minW={0} maxW="720px">
            {post.content && <Body text={post.content} />}

            <Divider my={12} borderColor="var(--border)" />
            <RatingBar slug={slugify(post.title)} />
            <Divider my={12} borderColor="var(--border)" />
            <CommentsSection slug={slugify(post.title)} />

            {related.length > 0 && (
              <Box mt={14}>
                <Text fontFamily="mono" fontSize="11px" color="gray.500" letterSpacing="0.14em" textTransform="uppercase" mb={3}>Keep reading</Text>
                <Flex gap={3} wrap="wrap">
                  {related.map((r) => <Fragment key={r.title}>{nav(r, "related")}</Fragment>)}
                </Flex>
              </Box>
            )}

            <Flex gap={3} mt={8} wrap="wrap">
              {newer && nav(newer, "← newer")}
              {older && nav(older, "older →")}
            </Flex>
          </Box>

          {headings.length > 1 && (
            <Box display={{ base: "none", lg: "block" }} position="sticky" top="90px" w="220px" flexShrink={0}>
              <Text fontFamily="mono" fontSize="10px" color="gray.500" letterSpacing="0.14em" textTransform="uppercase" mb={3}>On this page</Text>
              {headings.map((h) => (
                <Box key={h} as="a" href={`#${slugify(h)}`} display="block" fontSize="13px" color="fg.muted" py={1} pl={3}
                  borderLeft="2px solid var(--border)" _hover={{ color: "brand.400", borderColor: "brand.400", textDecoration: "none" }}>
                  {h}
                </Box>
              ))}
            </Box>
          )}
        </Flex>
      </Box>
    </MotionBox>
  );
};

export default BlogPostPage;
