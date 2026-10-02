import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
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
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { API_BASE } from "../config";
import {
  FaStar,
  FaRegStar,
  FaCommentDots,
  FaReply,
  FaArrowRight,
} from "react-icons/fa";

export interface BlogPost {
  title: string;
  date: string;
  readTime: string;
  excerpt: string;
  tags: string[];
  link?: string;
  content?: string;
  authors?: string[];
}

const MotionBox = motion(Box);

// Helpers

export const slugify = (title: string): string =>
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

// Content renderer

export const ContentRenderer = ({ text }: { text: string }) => {
  const border = useColorModeValue("purple.300", "purple.700");
  return (
    <Stack spacing={5} mt={2}>
      {text.split("\n\n").map((para, i) => {
        if (para.startsWith("> ")) {
          return (
            <Box key={i} borderLeft="3px solid" borderColor={border} pl={5}>
              <Text fontSize="md" color="fg.muted" fontStyle="italic" lineHeight="1.9">
                {para.slice(2)}
              </Text>
            </Box>
          );
        }
        return (
          <Text key={i} fontSize="md" color="fg.muted" lineHeight="1.9">
            {para}
          </Text>
        );
      })}
    </Stack>
  );
};

// Rating widget

interface Stats { count: number; average: number | null; comments: number }

export const RatingBar = ({ slug }: { slug: string }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [myRating, setMyRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [available, setAvailable] = useState(true);
  const toast = useToast();

  const load = useCallback(() => {
    fetch(`${API_BASE}/blog/${slug}/stats`)
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
      const res = await fetch(`${API_BASE}/blog/${slug}/rate`, {
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
    <Box>
      <Text fontSize="10px" fontFamily="mono" color="gray.500"
        letterSpacing="0.14em" textTransform="uppercase" mb={3}>
        Rate this post
      </Text>
      <HStack spacing={3} fontFamily="mono" fontSize="12px">
        <HStack spacing={1}>
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
                _hover={{ color: "yellow.300", transform: "scale(1.25)" }}
                sx={{ transition: "all 0.15s" }}
                cursor="pointer"
                p={1}
              >
                <Icon as={(filled ? FaStar : FaRegStar) as ElementType} boxSize={4} />
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
          <Text color="fg.subtle">be first to rate</Text>
        )}
      </HStack>
    </Box>
  );
};

// Comments section

interface Comment {
  id: number;
  name: string;
  message: string;
  reply_to: number | null;
  is_author: boolean;
  created_at: string;
}

export const CommentsSection = ({ slug }: { slug: string }) => {
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
    fetch(`${API_BASE}/blog/${slug}/comments`)
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
      const res = await fetch(`${API_BASE}/blog/${slug}/comments`, {
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
    <Box>
      <HStack spacing={2} mb={4}>
        <Icon as={FaCommentDots as ElementType} boxSize={3.5} color="gray.500" />
        <Text fontSize="10px" fontFamily="mono" color="gray.500"
          letterSpacing="0.14em" textTransform="uppercase">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </Text>
      </HStack>

      {loading ? (
        <Text fontSize="11px" color="fg.subtle" fontFamily="mono">loading…</Text>
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
        mt={4} p={4}
        borderRadius="12px"
        border="1px solid"
        borderColor={border}
        bg={useColorModeValue("white", "rgba(255,255,255,0.02)")}
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
            rows={3}
            resize="vertical"
            isDisabled={submitting}
          />
          <HStack justify="space-between">
            <Text fontSize="10px" color="fg.subtle" fontFamily="mono">
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
      bg={comment.is_author ? "rgba(var(--brand-rgb),0.06)" : "transparent"}
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
          <Text fontSize="10px" color="fg.subtle" fontFamily="mono">
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
      <Text fontSize="13px" color="fg.body" lineHeight="1.65" whiteSpace="pre-wrap">
        {comment.message}
      </Text>
    </Box>
  );
};

// Full-screen reader overlay

const BlogCard = ({
  post, index, featured, onOpen,
}: { post: BlogPost; index: number; featured?: boolean; onOpen: () => void }) => {
  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.07)");

  const handleClick = () => {
    if (post.link) {
      window.open(post.link, "_blank", "noopener,noreferrer");
    } else if (post.content) {
      onOpen();
    }
  };

  return (
    <MotionBox
      p={featured ? 7 : 5}
      borderRadius="12px"
      layerStyle="card"
      border="1px solid"
      borderColor={border}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      _hover={{
        borderColor: "brand.600",
        transform: "translateY(-2px)",
        boxShadow: "0 8px 30px rgba(var(--brand-rgb),0.10)",
      }}
      sx={{ transition: "all 0.25s ease" }}
      gridColumn={featured ? { base: "1", md: "1 / -1" } : undefined}
      cursor={post.content || post.link ? "pointer" : undefined}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(); }
      }}
    >
      <Stack spacing={3}>
        <HStack justify="space-between" align="flex-start">
          <Text fontSize="11px" color="gray.500" fontFamily="mono">{post.date}</Text>
          <Text fontSize="11px" color="fg.subtle" fontFamily="mono" whiteSpace="nowrap">
            {post.readTime}
          </Text>
        </HStack>

        <Heading size={featured ? "md" : "sm"} lineHeight="1.4">
          {post.title}
        </Heading>

        <Text fontSize="sm" color="fg.muted" lineHeight="1.75">
          {post.excerpt}
        </Text>

        <Wrap spacing={1.5}>
          {post.tags.map((tag) => (
            <WrapItem key={tag}>
              <Tag size="sm" colorScheme="purple" variant="subtle" fontSize="10px">{tag}</Tag>
            </WrapItem>
          ))}
        </Wrap>

        {/* Subtle read indicator */}
        {(post.content || post.link) && (
          <HStack spacing={1.5} alignSelf="flex-start" color="gray.500"
            _groupHover={{ color: "brand.400" }}
            sx={{ transition: "color 0.2s" }}>
            <Text fontSize="11px" fontFamily="mono">
              {post.link ? "read post" : "read"}
            </Text>
            <Icon as={FaArrowRight as ElementType} boxSize={2.5} />
          </HStack>
        )}
      </Stack>
    </MotionBox>
  );
};



const Blog = ({ blogs }: { blogs: BlogPost[] }) => {
  const navigate = useNavigate();
  const latest = blogs.slice(0, 3);

  return (
    <Box>
      <Flex justify="space-between" align="flex-end" mb={8} wrap="wrap" gap={2}>
        <Box>
          <Text fontSize="11px" fontFamily="mono" color="gray.500"
            letterSpacing="0.14em" mb={2} textTransform="uppercase">
            Writing
          </Text>
          <Heading size="lg">Notes &amp; Posts</Heading>
        </Box>
        <Button as={RouterLink} to="/blog" size="sm" variant="ghost" fontFamily="mono" fontSize="12px"
          color="brand.400" rightIcon={<Icon as={FaArrowRight as ElementType} boxSize={3} />}>
          all {blogs.length} posts
        </Button>
      </Flex>

      <Flex wrap="wrap" justify="center" gap={4} align="stretch">
        {latest.map((post, index) => (
          <Box
            key={post.title}
            flex={index === 0 ? "1 1 100%" : "1 1 320px"}
            maxW={index === 0 ? "100%" : { base: "100%", md: "calc(50% - 8px)" }}
          >
            <BlogCard
              post={post}
              index={index}
              featured={index === 0}
              onOpen={() => navigate(`/blog/${slugify(post.title)}`)}
            />
          </Box>
        ))}
      </Flex>
    </Box>
  );
};

export default Blog;
