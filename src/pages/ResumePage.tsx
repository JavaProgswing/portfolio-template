import {
  Box,
  Button,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useState, ElementType } from "react";
import { Link as RouterLink } from "react-router-dom";
import { FaDownload, FaExternalLinkAlt, FaFilePdf } from "react-icons/fa";

interface Props {
  data: { resumeUrl?: string; name: string };
}

const ResumePage = ({ data }: Props) => {
  const url = data.resumeUrl?.trim() || "";
  const isExternal = url.startsWith("http://") || url.startsWith("https://");
  const [embedFailed, setEmbedFailed] = useState(false);
  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.07)");

  // External URLs (Google Drive, etc.) often block iframe embedding.
  // Skip iframe attempt and just show a "open in new tab" link.
  useEffect(() => {
    if (isExternal && !url.endsWith(".pdf")) setEmbedFailed(true);
  }, [isExternal, url]);

  return (
    <Box maxW="900px" mx="auto" px={{ base: 5, md: 8 }} py={16}>
      <RouterLink to="/">
        <Text fontSize="11px" color="brand.400" fontFamily="mono" mb={6}
          _hover={{ color: "brand.300" }}>
          ← back to home
        </Text>
      </RouterLink>

      <HStack justify="space-between" align="flex-end" mb={3} flexWrap="wrap" gap={3}>
        <Box>
          <Text fontSize="11px" fontFamily="mono" color="gray.500"
            letterSpacing="0.14em" mb={2} textTransform="uppercase">
            Resume
          </Text>
          <Heading size="lg">Curriculum Vitae</Heading>
        </Box>
        {url && (
          <HStack spacing={2}>
            <Button
              as="a"
              href={url}
              download
              size="sm"
              variant="glow"
              leftIcon={<Icon as={FaDownload as ElementType} boxSize={3} />}
            >
              download
            </Button>
            <Button
              as="a"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              variant="outline"
              borderColor="rgba(255,255,255,0.14)"
              color="gray.400"
              fontFamily="mono"
              _hover={{
                color: "gray.100",
                borderColor: "rgba(255,255,255,0.3)",
                bg: "rgba(255,255,255,0.05)",
              }}
              leftIcon={<Icon as={FaExternalLinkAlt as ElementType} boxSize={2.5} />}
            >
              open
            </Button>
          </HStack>
        )}
      </HStack>

      {!url ? (
        <Box p={6} borderRadius="12px" layerStyle="card" border="1px solid"
          borderColor={border} textAlign="center">
          <Icon as={FaFilePdf as ElementType} boxSize={8} color="gray.600" mb={3} />
          <Text fontSize="sm" color="gray.500" mb={2}>
            No resume configured.
          </Text>
          <Text fontSize="xs" color="gray.600" fontFamily="mono">
            set <Text as="code" color="brand.400">resumeUrl</Text> in <Text as="code" color="brand.400">me.ts</Text>
          </Text>
        </Box>
      ) : embedFailed ? (
        <Box p={8} borderRadius="12px" layerStyle="card" border="1px solid"
          borderColor={border}>
          <Stack spacing={3} align="center" textAlign="center">
            <Icon as={FaFilePdf as ElementType} boxSize={10} color="red.400" />
            <Text fontSize="sm" color="gray.400">
              {data.name}'s resume
            </Text>
            <Text fontSize="xs" color="gray.500" fontFamily="mono">
              external URL · open in new tab to view
            </Text>
            <Button
              as="a" href={url} target="_blank" rel="noopener noreferrer"
              size="sm" variant="glow"
              leftIcon={<Icon as={FaExternalLinkAlt as ElementType} boxSize={3} />}
            >
              open resume
            </Button>
          </Stack>
        </Box>
      ) : (
        <Box
          borderRadius="12px"
          overflow="hidden"
          border="1px solid"
          borderColor={border}
          bg="#111"
        >
          <Box
            as="iframe"
            src={url}
            title={`${data.name} resume`}
            w="100%"
            h={{ base: "70vh", md: "85vh" }}
            border="0"
            onError={() => setEmbedFailed(true)}
          />
        </Box>
      )}
    </Box>
  );
};

export default ResumePage;
