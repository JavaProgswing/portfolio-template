import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Stack,
  Badge,
  Wrap,
  WrapItem,
  Collapse,
  Button,
  HStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useState } from "react";

export interface BlogPost {
  title: string;
  date: string;
  readTime: string;
  excerpt: string;
  tags: string[];
  link?: string;
  content?: string;
}

interface Props {
  blogs: BlogPost[];
}

const MotionBox = motion(Box);

const BlogCard = ({
  post,
  index,
}: {
  post: BlogPost;
  index: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const cardBg = useColorModeValue("white", "transparent");

  return (
    <MotionBox
      p={6}
      borderRadius="xl"
      bg={cardBg}
      layerStyle="glass"
      border="1px solid"
      borderColor={
        expanded ? "purple.500" : "rgba(255,255,255,0.08)"
      }
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      _hover={{
        borderColor: "purple.500",
        boxShadow: "0 0 25px rgba(128,90,213,0.12)",
      }}
      display="flex"
      flexDirection="column"
    >
      <Stack spacing={3} flex={1}>
        <HStack justify="space-between" align="flex-start">
          <Text
            fontSize="xs"
            color="gray.500"
            fontFamily="mono"
          >
            {post.date}
          </Text>
          <Text
            fontSize="xs"
            color="gray.500"
            fontFamily="mono"
            whiteSpace="nowrap"
          >
            {post.readTime}
          </Text>
        </HStack>

        <Heading
          size="md"
          lineHeight="1.4"
          _groupHover={{ color: "purple.400" }}
          transition="color 0.2s"
        >
          {post.title}
        </Heading>

        <Text fontSize="sm" color="gray.400" lineHeight="1.7">
          {post.excerpt}
        </Text>

        <Collapse in={expanded} animateOpacity>
          <Text
            fontSize="sm"
            color="gray.300"
            whiteSpace="pre-wrap"
            lineHeight="1.8"
            mt={3}
            borderLeft="2px solid"
            borderColor="purple.700"
            pl={4}
          >
            {post.content}
          </Text>
        </Collapse>

        <Wrap mt={1}>
          {post.tags.map((tag) => (
            <WrapItem key={tag}>
              <Badge
                px={2}
                py={0.5}
                borderRadius="full"
                colorScheme="purple"
                variant="subtle"
                fontSize="10px"
                fontFamily="mono"
              >
                {tag}
              </Badge>
            </WrapItem>
          ))}
        </Wrap>

        <Box mt="auto" pt={2}>
          {post.link ? (
            <Button
              as="a"
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              variant="glow"
            >
              Read Full Post
            </Button>
          ) : post.content ? (
            <Button
              onClick={() => setExpanded(!expanded)}
              size="sm"
              variant="link"
              colorScheme="purple"
              fontFamily="mono"
              fontSize="xs"
            >
              {expanded ? "↑ collapse" : "read more →"}
            </Button>
          ) : null}
        </Box>
      </Stack>
    </MotionBox>
  );
};

const Blog = ({ blogs }: Props) => {
  return (
    <Box maxW="5xl" mx="auto" px={6} py={10}>
      <Heading
        as="h2"
        size="xl"
        mb={10}
        textAlign="center"
        bgGradient="linear(to-r, purple.400, pink.400)"
        bgClip="text"
      >
        Writing
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {blogs.map((post, index) => (
          <BlogCard key={index} post={post} index={index} />
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default Blog;
