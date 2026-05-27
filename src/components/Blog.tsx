import {
  Box,
  Button,
  Collapse,
  Divider,
  Heading,
  HStack,
  Icon,
  Input,
  SimpleGrid,
  Stack,
  Tag,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState, ElementType } from "react";
import { motion } from "framer-motion";
import { FaStar, FaRegStar, FaCommentDots, FaReply } from "react-icons/fa";

export interface BlogPost {
  title: string;
  date: string;
  readTime: string;
  excerpt: string;
  tags: string[];
  link?: string;
  content?: string;
}

const MotionBox = motion(Box);

// ── Helpers ──────────────────────────────────────────────────────────────────

const slugify = (title: string): string =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const RATED_KEY = "portfolio-blog-rated"; // localStorage of rated slugs

const getRatedMap = (): Record<string, number> => {
  try {
    const raw = localStorage.getItem(RATED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const setRatedMap = (map: Record<string, number>) => {
  try { localStorage.setItem(RATED_KEY, JSON.stringify(map)); } catch { /* ignore */ }
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso + (iso.endsWith("Z") ? "" : "Z")).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  } catch {
    return iso;
  }
};

// ── Content renderer ────────────────────────────────────────────────────────

const ContentRenderer = ({ text }: { text: string }) => {
  const border = useColorModeValue("purple.300", "purple.700");
  return (
    <Stack spacing={4} mt={4}>
      {text.split("\n\n").map((para, i) => {
        if (para.startsWith("> ")) {
          return (
            <Box key={i} borderLeft="2px solid" borderColor={border} pl={4}>
              <Text fontSize="sm" color="gray.400" fontStyle="italic" lineHeight="1.8">
                {para.slice(2)}
              </Text>
            </Box>
          );
        }
        return (
          <Text key={i} fontSize="sm" color="gray.400" lineHeight="1.85">
            {para}
          </Text>
        );
      })}
    </Stack>
  );
};

// ── Rating widget ───────────────────────────────────────────────────────────

interface Stats { count: number; average: number | null; comments: number }

const RatingBar = ({ slug }: { slug: string }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [myRating, setMyRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [available, setAvailable] = useState(true);
  const toast = useToast();

  const load = useCallback(() => {
    fetch(`/api/portfolio/blog/${slug}/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setStats(d);
        else setAvailable(false);
      })
      .catch(() => setAvailable(false));
  }, [slug]);

  useEffect(() => {
    load();
    setMyRating(getRatedMap()[slug] || 0);
  }, [slug, load]);

  const rate = async (n: number) => {
    if (!available) return;
    setMyRating(n);
    const map = getRatedMap();
    map[slug] = n;
    setRatedMap(map);
    try {
      const res = await fetch(`/api/portfolio/blog/${slug}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: n }),
      });
      if (!res.ok) throw new Error();
      toast({
        title: `✓ rated ${n}/5`,
        status: "success",
        duration: 1500,
        position: "bottom-left",
        variant: "subtle",
      });
      load();
    } catch {
      toast({
        title: "couldn't save rating",
        status: "error",
        duration: 2000,
        position: "bottom-left",
        variant: "subtle",
      });
    }
  };

  if (!available) return null;

  return (
    <HStack spacing={3} fontFamily="mono" fontSize="11px">
      <HStack spacing={0.5}>
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = (hover || myRating) >= n;
          return (
            <Box
              key={n}
              as="button"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => rate(n)}
              color={filled ? "yellow.400" : "gray.600"}
              _hover={{ color: "yellow.300", transform: "scale(1.2)" }}
              sx={{ transition: "all 0.15s" }}
              cursor="pointer"
              p={0.5}
            >
              <Icon as={(filled ? FaStar : FaRegStar) as ElementType} boxSize={3.5} />
            </Box>
          );
        })}
      </HStack>
      {stats && stats.count > 0 ? (
        <Text color="gray.500">
          <Text as="span" color="yellow.400" fontWeight="600">{stats.average?.toFixed(1)}</Text>
          {" "}· {stats.count} {stats.count === 1 ? "vote" : "votes"}
        </Text>
      ) : (
        <Text color="gray.600">be first to rate</Text>
      )}
    </HStack>
  );
};

// ── Comments section ────────────────────────────────────────────────────────

interface Comment {
  id: number;
  name: string;
  message: string;
  reply_to: number | null;
  is_author: boolean;
  created_at: string;
}

const CommentsSection = ({ slug }: { slug: string }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.07)");

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/portfolio/blog/${slug}/comments`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setComments(Array.isArray(d) ? d : []))
      .catch(() => setAvailable(false))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  if (!available) return null;

  const submit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/portfolio/blog/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "anonymous",
          message: message.trim(),
          reply_to: replyTo,
        }),
      });
      if (!res.ok) throw new Error("fail");
      setMessage("");
      setReplyTo(null);
      toast({
        title: "✓ comment queued",
        description: "approved before publishing",
        status: "success",
        duration: 2500,
        position: "bottom-left",
        variant: "subtle",
      });
      load();
    } catch {
      toast({
        title: "couldn't submit",
        status: "error",
        duration: 2000,
        position: "bottom-left",
        variant: "subtle",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Build tree from flat list (one level of replies)
  const topLevel = comments.filter((c) => !c.reply_to);
  const repliesByParent = new Map<number, Comment[]>();
  comments.forEach((c) => {
    if (c.reply_to != null) {
      const arr = repliesByParent.get(c.reply_to) || [];
      arr.push(c);
      repliesByParent.set(c.reply_to, arr);
    }
  });

  return (
    <Box mt={6}>
      <HStack spacing={2} mb={3}>
        <Icon as={FaCommentDots as ElementType} boxSize={3} color="gray.500" />
        <Text fontSize="10px" fontFamily="mono" color="gray.500"
          letterSpacing="0.14em" textTransform="uppercase">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </Text>
      </HStack>

      {loading ? (
        <Text fontSize="11px" color="gray.600" fontFamily="mono">loading…</Text>
      ) : (
        <Stack spacing={3}>
          {topLevel.map((c) => (
            <Box key={c.id}>
              <CommentBubble
                comment={c}
                onReply={() => setReplyTo(c.id)}
                border={border}
              />
              {repliesByParent.get(c.id)?.map((r) => (
                <Box key={r.id} ml={6} mt={2}>
                  <CommentBubble
                    comment={r}
                    onReply={() => setReplyTo(c.id)}
                    border={border}
                  />
                </Box>
              ))}
            </Box>
          ))}
        </Stack>
      )}

      {/* Submit form */}
      <Box
        mt={4} p={3}
        borderRadius="10px"
        layerStyle="card"
        border="1px solid"
        borderColor={border}
      >
        {replyTo !== null && (
          <HStack
            mb={2} fontFamily="mono" fontSize="10px" color="gray.500" spacing={1}
          >
            <Icon as={FaReply as ElementType} boxSize={2.5} />
            <Text>replying to #{replyTo}</Text>
            <Text
              as="button"
              color="brand.400"
              onClick={() => setReplyTo(null)}
              _hover={{ textDecoration: "underline" }}
              ml={2}
            >
              cancel
            </Text>
          </HStack>
        )}
        <Stack spacing={2}>
          <Input
            placeholder="name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={64}
            size="sm"
            isDisabled={submitting}
          />
          <Textarea
            placeholder={replyTo ? "your reply…" : "leave a comment…"}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            size="sm"
            rows={2}
            resize="vertical"
            isDisabled={submitting}
          />
          <HStack justify="space-between">
            <Text fontSize="10px" color="gray.600" fontFamily="mono">
              {message.length}/1000 · moderated
            </Text>
            <Button
              size="xs"
              variant="glow"
              onClick={submit}
              isLoading={submitting}
              isDisabled={!message.trim()}
            >
              post
            </Button>
          </HStack>
        </Stack>
      </Box>
    </Box>
  );
};

const CommentBubble = ({
  comment, onReply, border,
}: { comment: Comment; onReply: () => void; border: string }) => {
  return (
    <Box
      p={3}
      borderRadius="10px"
      border="1px solid"
      borderColor={comment.is_author ? "brand.500" : border}
      bg={comment.is_author ? "rgba(99,102,241,0.06)" : "transparent"}
    >
      <HStack justify="space-between" mb={1} align="center">
        <HStack spacing={2}>
          <Text fontSize="xs" fontWeight="600"
            color={comment.is_author ? "brand.400" : "gray.300"}>
            {comment.name}
          </Text>
          {comment.is_author && (
            <Tag size="sm" colorScheme="purple" variant="subtle" fontSize="9px">
              author
            </Tag>
          )}
        </HStack>
        <HStack spacing={2}>
          <Text fontSize="10px" color="gray.600" fontFamily="mono">
            {formatDate(comment.created_at)}
          </Text>
          <Box
            as="button"
            onClick={onReply}
            fontSize="10px"
            color="gray.500"
            fontFamily="mono"
            _hover={{ color: "brand.400" }}
            display="flex"
            alignItems="center"
            gap={1}
          >
            <Icon as={FaReply as ElementType} boxSize={2.5} />
            reply
          </Box>
        </HStack>
      </HStack>
      <Text fontSize="13px" color="gray.300" lineHeight="1.65" whiteSpace="pre-wrap">
        {comment.message}
      </Text>
    </Box>
  );
};

// ── Blog card ───────────────────────────────────────────────────────────────

const BlogCard = ({
  post, index, featured,
}: { post: BlogPost; index: number; featured?: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.07)");
  const slug = slugify(post.title);

  return (
    <MotionBox
      p={featured ? 7 : 5}
      borderRadius="12px"
      layerStyle="card"
      border="1px solid"
      borderColor={expanded ? "brand.600" : border}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      _hover={{ borderColor: "brand.600" }}
      gridColumn={featured ? { base: "1", md: "1 / -1" } : undefined}
    >
      <Stack spacing={3}>
        <HStack justify="space-between" align="flex-start">
          <Text fontSize="11px" color="gray.500" fontFamily="mono">{post.date}</Text>
          <Text fontSize="11px" color="gray.600" fontFamily="mono" whiteSpace="nowrap">
            {post.readTime}
          </Text>
        </HStack>

        <Heading size={featured ? "md" : "sm"} lineHeight="1.4">
          {post.title}
        </Heading>

        <Text fontSize="sm" color="gray.400" lineHeight="1.75">
          {post.excerpt}
        </Text>

        <Collapse in={expanded} animateOpacity>
          {post.content && <ContentRenderer text={post.content} />}

          {/* Rating + comments only shown when expanded */}
          <Box mt={6}>
            <Divider borderColor="rgba(255,255,255,0.08)" mb={4} />
            <RatingBar slug={slug} />
            <CommentsSection slug={slug} />
          </Box>
        </Collapse>

        <Wrap spacing={1.5}>
          {post.tags.map((tag) => (
            <WrapItem key={tag}>
              <Tag size="sm" colorScheme="purple" variant="subtle" fontSize="10px">{tag}</Tag>
            </WrapItem>
          ))}
        </Wrap>

        {post.link ? (
          <Button as="a" href={post.link} target="_blank" rel="noopener noreferrer"
            size="xs" variant="glow" alignSelf="flex-start" fontFamily="mono">
            read post ↗
          </Button>
        ) : post.content ? (
          <Button onClick={() => setExpanded((v) => !v)} size="xs" variant="link"
            colorScheme="purple" alignSelf="flex-start" fontFamily="mono">
            {expanded ? "↑ collapse" : "↓ read more · rate · comment"}
          </Button>
        ) : null}
      </Stack>
    </MotionBox>
  );
};

const Blog = ({ blogs }: { blogs: BlogPost[] }) => {
  return (
    <Box>
      <Text fontSize="11px" fontFamily="mono" color="gray.500"
        letterSpacing="0.14em" mb={2} textTransform="uppercase">
        Writing
      </Text>
      <Heading size="lg" mb={8}>Notes & Posts</Heading>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {blogs.map((post, index) => (
          <BlogCard key={post.title} post={post} index={index} featured={index === 0} />
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default Blog;
