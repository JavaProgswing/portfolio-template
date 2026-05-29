import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
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
import { motion, AnimatePresence } from "framer-motion";
import {
  FaStar,
  FaRegStar,
  FaCommentDots,
  FaReply,
  FaArrowRight,
  FaTimes,
  FaArrowUp,
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

// Content renderer

const ContentRenderer = ({ text }: { text: string }) => {
  const border = useColorModeValue("purple.300", "purple.700");
  return (
    <Stack spacing={5} mt={2}>
      {text.split("\n\n").map((para, i) => {
        if (para.startsWith("> ")) {
          return (
            <Box key={i} borderLeft="3px solid" borderColor={border} pl={5}>
              <Text fontSize="md" color="gray.400" fontStyle="italic" lineHeight="1.9">
                {para.slice(2)}
              </Text>
            </Box>
          );
        }
        return (
          <Text key={i} fontSize="md" color="gray.400" lineHeight="1.9">
            {para}
          </Text>
        );
      })}
    </Stack>
  );
};

// Rating widget

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
          <Text color="gray.600">be first to rate</Text>
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
    <Box>
      <HStack spacing={2} mb={4}>
        <Icon as={FaCommentDots as ElementType} boxSize={3.5} color="gray.500" />
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

// Full-screen reader overlay

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const panelVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0, y: 30, scale: 0.97,
    transition: { duration: 0.2, ease: "easeIn" as const },
  },
};

const BlogReader = ({ post, onClose }: { post: BlogPost; onClose: () => void }) => {
  const slug = slugify(post.title);
  const overlayBg = useColorModeValue("rgba(255,255,255,0.85)", "rgba(0,0,0,0.82)");
  const panelBg = useColorModeValue("white", "gray.900");
  const headerBg = useColorModeValue(
    "rgba(255,255,255,0.75)",
    "rgba(17,17,25,0.78)"
  );
  const dividerColor = useColorModeValue("gray.200", "rgba(255,255,255,0.06)");

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const scrollToTop = () => {
    const el = document.getElementById("blog-reader-scroll");
    el?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <MotionBox
      position="fixed"
      inset={0}
      zIndex={1500}
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Backdrop */}
      <Box
        position="absolute" inset={0}
        bg={overlayBg}
        backdropFilter="blur(16px)"
        onClick={onClose}
      />

      {/* Panel */}
      <MotionBox
        position="relative"
        zIndex={1}
        h="100%"
        display="flex"
        flexDirection="column"
        variants={panelVariants}
      >
        {/* Sticky header */}
        <Box
          position="sticky" top={0} zIndex={2}
          bg={headerBg}
          backdropFilter="blur(20px)"
          borderBottom="1px solid"
          borderColor={dividerColor}
          px={{ base: 5, md: 10 }}
          py={3}
        >
          <Flex
            maxW="720px" mx="auto"
            justify="space-between" align="center"
          >
            <HStack spacing={3}>
              <IconButton
                aria-label="Close"
                icon={<Icon as={FaTimes as ElementType} />}
                onClick={onClose}
                variant="ghost"
                size="sm"
                borderRadius="full"
                color="gray.400"
                _hover={{ color: "gray.200", bg: "rgba(255,255,255,0.08)" }}
              />
              {post.authors && post.authors.length > 0 && (
                <Text fontSize="11px" fontFamily="mono" color="gray.500"
                  display={{ base: "none", sm: "block" }}>
                  by {post.authors.join(", ")}
                </Text>
              )}
            </HStack>
            <HStack spacing={2}>
              <Text fontSize="11px" fontFamily="mono" color="gray.600">
                esc to close
              </Text>
            </HStack>
          </Flex>
        </Box>

        {/* Scrollable content */}
        <Box
          id="blog-reader-scroll"
          flex={1}
          overflowY="auto"
          bg={panelBg}
          sx={{
            "&::-webkit-scrollbar": { width: "6px" },
            "&::-webkit-scrollbar-track": { bg: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              bg: "rgba(255,255,255,0.08)",
              borderRadius: "3px",
            },
          }}
        >
          <Box maxW="720px" mx="auto" px={{ base: 5, md: 10 }} py={10}>
            {/* Meta */}
            <HStack spacing={3} mb={4}>
              <Text fontSize="12px" fontFamily="mono" color="gray.500">{post.date}</Text>
              <Text fontSize="12px" color="gray.700">·</Text>
              <Text fontSize="12px" fontFamily="mono" color="gray.500">{post.readTime}</Text>
            </HStack>

            {/* Title */}
            <Heading size="xl" lineHeight="1.3" mb={4}>
              {post.title}
            </Heading>

            {/* Tags */}
            <Wrap spacing={2} mb={8}>
              {post.tags.map((tag) => (
                <WrapItem key={tag}>
                  <Tag size="sm" colorScheme="purple" variant="subtle" fontSize="10px">{tag}</Tag>
                </WrapItem>
              ))}
            </Wrap>

            {/* Excerpt as lead */}
            <Text fontSize="lg" color="gray.400" lineHeight="1.8" mb={6}
              fontStyle="italic" borderLeft="3px solid" borderColor="brand.500" pl={5}>
              {post.excerpt}
            </Text>

            {/* Content body */}
            {post.content && <ContentRenderer text={post.content} />}

            {/* Divider → Rating */}
            <Divider borderColor={dividerColor} my={10} />
            <RatingBar slug={slug} />

            {/* Divider → Comments */}
            <Divider borderColor={dividerColor} my={10} />
            <CommentsSection slug={slug} />

            {/* Scroll to top */}
            <Flex justify="center" mt={12} mb={4}>
              <Button
                size="sm" variant="ghost" fontFamily="mono" fontSize="11px"
                leftIcon={<Icon as={FaArrowUp as ElementType} boxSize={3} />}
                color="gray.500"
                _hover={{ color: "brand.400" }}
                onClick={scrollToTop}
              >
                back to top
              </Button>
            </Flex>
          </Box>
        </Box>
      </MotionBox>
    </MotionBox>
  );
};



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
        boxShadow: "0 8px 30px rgba(99,102,241,0.10)",
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
  const [openPost, setOpenPost] = useState<BlogPost | null>(null);

  return (
    <Box>
      <Text fontSize="11px" fontFamily="mono" color="gray.500"
        letterSpacing="0.14em" mb={2} textTransform="uppercase">
        Writing
      </Text>
      <Heading size="lg" mb={8}>Notes &amp; Posts</Heading>

      <Flex wrap="wrap" justify="center" gap={4} align="stretch">
        {blogs.map((post, index) => (
          <Box
            key={post.title}
            flex={index === 0 ? "1 1 100%" : "1 1 320px"}
            maxW={index === 0 ? "100%" : { base: "100%", md: "calc(50% - 8px)" }}
          >
            <BlogCard
              post={post}
              index={index}
              featured={index === 0}
              onOpen={() => setOpenPost(post)}
            />
          </Box>
        ))}
      </Flex>

      {/* Full-screen reader overlay */}
      <AnimatePresence>
        {openPost && openPost.content && (
          <BlogReader
            key={openPost.title}
            post={openPost}
            onClose={() => setOpenPost(null)}
          />
        )}
      </AnimatePresence>
    </Box>
  );
};

export default Blog;
