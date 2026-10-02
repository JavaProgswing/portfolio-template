import {
  Box, Flex, Heading, HStack, Icon, Input, InputGroup, InputLeftElement,
  Tag, Text, Wrap, WrapItem, Stack,
} from "@chakra-ui/react";
import { ElementType, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { motion } from "framer-motion";
import { FaSearch, FaArrowRight, FaExternalLinkAlt } from "react-icons/fa";
import { BlogPost, slugify } from "../components/Blog";

const MotionBox = motion(Box);

const BlogPage = ({ blogs }: { blogs: BlogPost[] }) => {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  const tags = useMemo(() => {
    const m = new Map<string, number>();
    blogs.forEach((b) => b.tags.forEach((t) => m.set(t, (m.get(t) || 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [blogs]);

  const shown = blogs.filter((b) => {
    if (tag && !b.tags.includes(tag)) return false;
    const n = q.trim().toLowerCase();
    if (!n) return true;
    return (
      b.title.toLowerCase().includes(n) ||
      b.excerpt.toLowerCase().includes(n) ||
      b.tags.some((t) => t.toLowerCase().includes(n))
    );
  });

  return (
    <Box maxW="860px" mx="auto" px={{ base: 5, md: 8 }} py={{ base: 14, md: 20 }}>
      <Text as={RouterLink} to="/" fontSize="11px" color="brand.400" fontFamily="mono" display="inline-block" mb={6}>
        ← back to home
      </Text>
      <Text fontSize="11px" fontFamily="mono" color="fg.subtle" letterSpacing="0.14em" mb={2} textTransform="uppercase">
        The Blog
      </Text>
      <Heading size="2xl" mb={3} className="grad-text">Notes &amp; write-ups</Heading>
      <Text color="fg.muted" maxW="560px" mb={8} lineHeight="1.75">
        Deep dives, bug hunts and things I learned the hard way. {blogs.length} posts, newest first.
      </Text>

      <InputGroup mb={4} size="md">
        <InputLeftElement pointerEvents="none">
          <Icon as={FaSearch as ElementType} color="fg.subtle" boxSize={3.5} />
        </InputLeftElement>
        <Input
          placeholder="search posts, tags…" value={q} onChange={(e) => setQ(e.target.value)}
          fontFamily="mono" fontSize="13px" borderRadius="10px" variant="filled"
          bg="var(--surface)" _hover={{ bg: "var(--surface-strong)" }}
        />
      </InputGroup>

      <Wrap spacing={2} mb={10}>
        <WrapItem>
          <Tag cursor="pointer" size="md" variant={tag === null ? "solid" : "subtle"} colorScheme="purple" onClick={() => setTag(null)}>
            all
          </Tag>
        </WrapItem>
        {tags.map(([t, n]) => (
          <WrapItem key={t}>
            <Tag cursor="pointer" size="md" variant={tag === t ? "solid" : "subtle"} colorScheme="purple"
              onClick={() => setTag(tag === t ? null : t)}>
              {t} · {n}
            </Tag>
          </WrapItem>
        ))}
      </Wrap>

      <Stack spacing={4}>
        {shown.length === 0 && (
          <Text color="fg.subtle" fontFamily="mono" fontSize="sm">no posts match. try fewer words.</Text>
        )}
        {shown.map((post, i) => {
          const external = !post.content && post.link;
          const linkProps: any = external
            ? { as: "a", href: post.link, target: "_blank", rel: "noopener noreferrer" }
            : { as: RouterLink, to: `/blog/${slugify(post.title)}` };
          return (
            <MotionBox
              key={post.title}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.05 }}
            >
              <Box
                {...linkProps}
                display="block" p={{ base: 5, md: 6 }} borderRadius="14px" layerStyle="card"
                className="lift" _hover={{ textDecoration: "none" }}
              >
                <Flex justify="space-between" mb={2} gap={3}>
                  <Text fontSize="11px" fontFamily="mono" color="fg.subtle">{post.date}</Text>
                  <Text fontSize="11px" fontFamily="mono" color="fg.subtle" whiteSpace="nowrap">{post.readTime}</Text>
                </Flex>
                <Heading size={i === 0 && !q && !tag ? "lg" : "md"} lineHeight="1.35" mb={2}>{post.title}</Heading>
                <Text fontSize="sm" color="fg.muted" lineHeight="1.75" mb={3}>{post.excerpt}</Text>
                <Flex justify="space-between" align="center" gap={3} wrap="wrap">
                  <HStack spacing={1.5} wrap="wrap">
                    {post.tags.map((t) => (
                      <Tag key={t} size="sm" colorScheme="purple" variant="subtle" fontSize="10px">{t}</Tag>
                    ))}
                  </HStack>
                  <HStack spacing={1.5} color="brand.400" fontFamily="mono" fontSize="11px">
                    <Text color="inherit">{external ? "read externally" : "read"}</Text>
                    <Icon as={(external ? FaExternalLinkAlt : FaArrowRight) as ElementType} boxSize={2.5} />
                  </HStack>
                </Flex>
              </Box>
            </MotionBox>
          );
        })}
      </Stack>
    </Box>
  );
};

export default BlogPage;
