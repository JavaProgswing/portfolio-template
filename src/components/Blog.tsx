import {
  Box,
  Collapse,
  Heading,
  HStack,
  SimpleGrid,
  Stack,
  Tag,
  Text,
  useColorModeValue,
  Wrap,
  WrapItem,
  Button,
} from "@chakra-ui/react";
import { useState } from "react";
import { motion } from "framer-motion";

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

/** Splits content on blank lines into paragraphs. Lines starting with `> ` become blockquotes. */
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

const BlogCard = ({ post, index, featured }: { post: BlogPost; index: number; featured?: boolean }) => {
  const [expanded, setExpanded] = useState(false);
  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.07)");

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
          <Text fontSize="11px" color="gray.600" fontFamily="mono" whiteSpace="nowrap">{post.readTime}</Text>
        </HStack>

        <Heading size={featured ? "md" : "sm"} lineHeight="1.4">
          {post.title}
        </Heading>

        <Text fontSize="sm" color="gray.400" lineHeight="1.75">
          {post.excerpt}
        </Text>

        <Collapse in={expanded} animateOpacity>
          {post.content && <ContentRenderer text={post.content} />}
        </Collapse>

        <Wrap spacing={1.5}>
          {post.tags.map(tag => (
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
          <Button onClick={() => setExpanded(v => !v)} size="xs" variant="link"
            colorScheme="purple" alignSelf="flex-start" fontFamily="mono">
            {expanded ? "↑ collapse" : "↓ read more"}
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
          <BlogCard key={index} post={post} index={index} featured={index === 0} />
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default Blog;
