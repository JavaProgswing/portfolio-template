import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";

const MotionBox = motion(Box);

interface NowSection { label: string; content: string }
interface NowData { updatedAt: string; sections: NowSection[] }

const NowPage = ({ data }: { data: { now?: NowData; name: string } }) => {
  const now = data.now;

  return (
    <Box maxW="780px" mx="auto" px={{ base: 5, md: 8 }} py={20}>
      <RouterLink to="/">
        <Text fontSize="11px" color="brand.400" fontFamily="mono" mb={6}
          _hover={{ color: "brand.300" }}>
          ← back to home
        </Text>
      </RouterLink>

      <Text fontSize="11px" fontFamily="mono" color="gray.500"
        letterSpacing="0.14em" mb={2} textTransform="uppercase">
        Now
      </Text>
      <Heading size="lg" mb={3}>What I'm Doing Now</Heading>
      <Text fontSize="md" color="gray.400" mb={3} maxW="600px" lineHeight="1.75">
        Longer-form version of the "NOW" widget on the homepage.
        Inspired by{" "}
        <Text as="a" href="https://nownownow.com/about" target="_blank" rel="noopener"
          color="brand.400" _hover={{ color: "brand.300" }}>
          nownownow.com
        </Text>.
      </Text>

      {now && (
        <Text fontSize="11px" color="gray.600" fontFamily="mono" mb={10}>
          last updated: {now.updatedAt}
        </Text>
      )}

      {!now && (
        <Text fontSize="sm" color="gray.500" fontStyle="italic">
          (Configure your now sections in <Text as="code" color="brand.400">me.ts → now</Text>)
        </Text>
      )}

      <Stack spacing={8}>
        {now?.sections.map((section, i) => (
          <MotionBox
            key={section.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <Text fontSize="10px" fontFamily="mono" color="gray.500"
              letterSpacing="0.16em" mb={2} textTransform="uppercase">
              {section.label}
            </Text>
            <Text fontSize="md" color="gray.300" lineHeight="1.8" maxW="640px"
              whiteSpace="pre-wrap">
              {section.content}
            </Text>
          </MotionBox>
        ))}
      </Stack>
    </Box>
  );
};

export default NowPage;
