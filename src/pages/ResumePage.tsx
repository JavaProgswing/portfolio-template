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
import {
  FaDownload,
  FaExternalLinkAlt,
  FaFilePdf,
  FaExpand,
  FaCompress,
} from "react-icons/fa";

interface Props {
  data: { resumeUrl?: string; name: string };
}

const ResumePage = ({ data }: Props) => {
  const url = data.resumeUrl?.trim() || "";
  const isExternal = url.startsWith("http://") || url.startsWith("https://");
  const [embedFailed, setEmbedFailed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const border = useColorModeValue("gray.200", "rgba(255,255,255,0.07)");
  const toolbarBg = useColorModeValue("rgba(255,255,255,0.85)", "rgba(17,17,24,0.85)");

  // External non-PDF URL (Google Drive viewer page etc.) probably blocks iframe
  useEffect(() => {
    if (isExternal && !url.toLowerCase().endsWith(".pdf")) setEmbedFailed(true);
  }, [isExternal, url]);

  // Esc to exit fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  // ── No resume configured ──────────────────────────────────────────────────
  if (!url) {
    return (
      <Box maxW="900px" mx="auto" px={6} py={20}>
        <RouterLink to="/">
          <Text fontSize="11px" color="brand.400" fontFamily="mono" mb={6}>
            ← back to home
          </Text>
        </RouterLink>
        <Box p={8} borderRadius="12px" layerStyle="card"
          border="1px solid" borderColor={border} textAlign="center">
          <Icon as={FaFilePdf as ElementType} boxSize={10} color="gray.600" mb={3} />
          <Heading size="md" color="gray.300" mb={2}>No resume configured</Heading>
          <Text fontSize="sm" color="gray.500" fontFamily="mono">
            set <Text as="code" color="brand.400">resumeUrl</Text> in <Text as="code" color="brand.400">me.ts</Text>
          </Text>
        </Box>
      </Box>
    );
  }

  // ── External URL that blocks embedding ────────────────────────────────────
  if (embedFailed) {
    return (
      <Box maxW="600px" mx="auto" px={6} py={20}>
        <RouterLink to="/">
          <Text fontSize="11px" color="brand.400" fontFamily="mono" mb={6}>
            ← back to home
          </Text>
        </RouterLink>
        <Box p={8} borderRadius="12px" layerStyle="card"
          border="1px solid" borderColor={border}>
          <Stack spacing={4} align="center" textAlign="center">
            <Icon as={FaFilePdf as ElementType} boxSize={10} color="red.400" />
            <Heading size="md">{data.name}'s resume</Heading>
            <Text fontSize="xs" color="gray.500" fontFamily="mono">
              external host blocks embedding · open in new tab to view
            </Text>
            <HStack spacing={2}>
              <Button as="a" href={url} target="_blank" rel="noopener noreferrer"
                size="sm" variant="glow"
                leftIcon={<Icon as={FaExternalLinkAlt as ElementType} boxSize={3} />}>
                open
              </Button>
              <Button as="a" href={url} download
                size="sm" variant="outline"
                borderColor="rgba(255,255,255,0.14)" color="gray.400"
                _hover={{ color: "gray.100", borderColor: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.05)" }}
                leftIcon={<Icon as={FaDownload as ElementType} boxSize={3} />}>
                download
              </Button>
            </HStack>
          </Stack>
        </Box>
      </Box>
    );
  }

  // ── Inline PDF viewer ─────────────────────────────────────────────────────
  const viewerHeight = fullscreen ? "100vh" : "calc(100vh - 200px)";

  return (
    <Box
      maxW={fullscreen ? "100%" : "1100px"}
      mx="auto"
      px={fullscreen ? 0 : { base: 4, md: 8 }}
      py={fullscreen ? 0 : 12}
      position={fullscreen ? "fixed" : "static"}
      top={fullscreen ? 0 : "auto"}
      left={fullscreen ? 0 : "auto"}
      right={fullscreen ? 0 : "auto"}
      bottom={fullscreen ? 0 : "auto"}
      bg={fullscreen ? "#09090b" : "transparent"}
      zIndex={fullscreen ? 2000 : "auto"}
    >
      {!fullscreen && (
        <>
          <RouterLink to="/">
            <Text fontSize="11px" color="brand.400" fontFamily="mono" mb={6}>
              ← back to home
            </Text>
          </RouterLink>

          <HStack justify="space-between" align="flex-end" mb={4} flexWrap="wrap" gap={3}>
            <Box>
              <Text fontSize="11px" fontFamily="mono" color="gray.500"
                letterSpacing="0.14em" mb={2} textTransform="uppercase">
                Resume
              </Text>
              <Heading size="lg">Curriculum Vitae</Heading>
            </Box>
          </HStack>
        </>
      )}

      {/* Sticky toolbar */}
      <HStack
        position={fullscreen ? "fixed" : "sticky"}
        top={fullscreen ? "16px" : "60px"}
        right={fullscreen ? "16px" : "auto"}
        left={fullscreen ? "auto" : "auto"}
        zIndex={fullscreen ? 2001 : 50}
        spacing={1.5}
        p={1.5}
        bg={toolbarBg}
        backdropFilter="blur(12px)"
        border="1px solid"
        borderColor={border}
        borderRadius="lg"
        boxShadow="0 4px 24px rgba(0,0,0,0.3)"
        w="fit-content"
        ml={fullscreen ? "auto" : "auto"}
        mb={fullscreen ? 0 : 3}
      >
        <Button
          as="a"
          href={url}
          download
          size="xs"
          variant="ghost"
          color="gray.400"
          fontFamily="mono"
          fontSize="11px"
          h="28px"
          leftIcon={<Icon as={FaDownload as ElementType} boxSize={3} />}
          _hover={{ color: "brand.400", bg: "rgba(99,102,241,0.08)" }}
        >
          download
        </Button>
        <Button
          as="a"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          size="xs"
          variant="ghost"
          color="gray.400"
          fontFamily="mono"
          fontSize="11px"
          h="28px"
          leftIcon={<Icon as={FaExternalLinkAlt as ElementType} boxSize={2.5} />}
          _hover={{ color: "brand.400", bg: "rgba(99,102,241,0.08)" }}
        >
          new tab
        </Button>
        <Button
          onClick={() => setFullscreen((v) => !v)}
          size="xs"
          variant="ghost"
          color="gray.400"
          fontFamily="mono"
          fontSize="11px"
          h="28px"
          leftIcon={<Icon as={(fullscreen ? FaCompress : FaExpand) as ElementType} boxSize={2.5} />}
          _hover={{ color: "brand.400", bg: "rgba(99,102,241,0.08)" }}
          title="fullscreen (esc to exit)"
        >
          {fullscreen ? "exit" : "fullscreen"}
        </Button>
      </HStack>

      {/* PDF viewer */}
      <Box
        borderRadius={fullscreen ? "0" : "12px"}
        overflow="hidden"
        border={fullscreen ? "none" : "1px solid"}
        borderColor={border}
        bg="#111"
        h={viewerHeight}
        position="relative"
      >
        <Box
          as="iframe"
          src={url + "#view=FitH"}
          title={`${data.name} resume`}
          w="100%"
          h="100%"
          border="0"
          onError={() => setEmbedFailed(true)}
        />
      </Box>

      {!fullscreen && (
        <Text fontSize="10px" color="gray.600" fontFamily="mono"
          textAlign="center" mt={3}>
          scroll within frame · zoom with browser controls · fullscreen for distraction-free
        </Text>
      )}
    </Box>
  );
};

export default ResumePage;
