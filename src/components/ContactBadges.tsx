import {
  Box,
  Button,
  Divider,
  HStack,
  Icon,
  Image,
  Link,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Tag,
  Text,
  Tooltip,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { useEffect, useState, ElementType } from "react";
import { motion } from "framer-motion";
import { getSiteIconUrl } from "../services/favicon-site-url";
import { FaSpotify, FaLinkedin, FaArrowRight } from "react-icons/fa";

interface Contact {
  id: string;
  name: string;
  site: string;
  link: string;
  nowPlayingApi?: string;
}

interface Profile {
  name: string;
  image: string;
  tags: string[];
  languages: string[];
  currentWork?: {
    title: string;
    org: string;
  };
  resumeUrl?: string;
}

interface Props {
  contacts: Contact[];
  profile?: Profile;
}

interface NowPlaying {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumImageUrl?: string;
  songUrl?: string;
}

const BRAND: Record<string, { color: string; glow: string }> = {
  github:    { color: "#fafafa", glow: "rgba(255,255,255,0.25)" },
  linkedin:  { color: "#0a66c2", glow: "rgba(10,102,194,0.45)" },
  instagram: { color: "#e4405f", glow: "rgba(228,64,95,0.45)" },
  twitter:   { color: "#fafafa", glow: "rgba(255,255,255,0.25)" },
  x:         { color: "#fafafa", glow: "rgba(255,255,255,0.25)" },
  spotify:   { color: "#1db954", glow: "rgba(29,185,84,0.5)" },
};

const MotionBox = motion(Box);

// ── Shared button style props ─────────────────────────────────────────────────

const baseButtonProps = (brand: { color: string; glow: string }) => ({
  display: "inline-flex" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  w: "32px",
  h: "32px",
  borderRadius: "md",
  color: "gray.500",
  cursor: "pointer" as const,
  _hover: {
    color: brand.color,
    bg: `${brand.color}1a`,
    boxShadow: `0 0 14px ${brand.glow}`,
  },
  sx: { transition: "color 0.2s, background 0.2s, box-shadow 0.2s" },
});

// ── Standard badge (no popover) ───────────────────────────────────────────────

const StandardBadge = ({ contact }: { contact: Contact }) => {
  const brand = BRAND[contact.id] ?? { color: "#a1a1aa", glow: "rgba(255,255,255,0.15)" };
  const IconComp = getSiteIconUrl(contact.id) as ElementType;

  return (
    <Tooltip label={contact.name} fontSize="11px" hasArrow placement="bottom">
      <Link
        href={contact.link}
        isExternal
        aria-label={contact.name}
        display="inline-flex"
        _hover={{ textDecoration: "none" }}
      >
        <MotionBox
          {...baseButtonProps(brand)}
          whileHover={{ scale: 1.1, y: -1 }}
          whileTap={{ scale: 0.93 }}
        >
          <Icon as={IconComp} boxSize={4} />
        </MotionBox>
      </Link>
    </Tooltip>
  );
};

// ── LinkedIn — mini business card popover ─────────────────────────────────────

const LinkedInBadge = ({ contact, profile }: { contact: Contact; profile?: Profile }) => {
  if (!profile) return <StandardBadge contact={contact} />;

  const brand = BRAND.linkedin;

  return (
    <Popover placement="bottom-end" trigger="click" gutter={8}>
      <PopoverTrigger>
        <MotionBox
          as="button"
          aria-label="LinkedIn · click for profile preview"
          {...baseButtonProps(brand)}
          whileHover={{ scale: 1.1, y: -1 }}
          whileTap={{ scale: 0.93 }}
        >
          <Icon as={FaLinkedin as ElementType} boxSize={4} />
        </MotionBox>
      </PopoverTrigger>

      <PopoverContent
        bg="#0f0f10"
        borderColor="rgba(255,255,255,0.1)"
        boxShadow="0 12px 36px rgba(0,0,0,0.6)"
        w="320px"
        _focus={{ outline: "none", boxShadow: "0 12px 36px rgba(0,0,0,0.6)" }}
      >
        <PopoverArrow bg="#0f0f10" />
        <PopoverBody p={4}>
          {/* Avatar + name */}
          <HStack spacing={3} mb={3}>
            <Image
              src={profile.image}
              alt={profile.name}
              w="48px"
              h="48px"
              borderRadius="full"
              objectFit="cover"
              border="1px solid rgba(255,255,255,0.1)"
              flexShrink={0}
            />
            <Box minW={0}>
              <Text fontSize="sm" fontWeight="600" color="gray.100" noOfLines={1}>
                {profile.name}
              </Text>
              <Text fontSize="11px" color="gray.500" noOfLines={2}>
                {profile.tags.join(" · ")}
              </Text>
            </Box>
          </HStack>

          <Divider borderColor="rgba(255,255,255,0.08)" mb={3} />

          {/* Current focus */}
          {profile.currentWork && (
            <Box mb={3}>
              <Text
                fontSize="9px"
                color="gray.600"
                fontFamily="mono"
                letterSpacing="0.14em"
                mb={1}
                textTransform="uppercase"
              >
                Currently
              </Text>
              <Text fontSize="xs" fontWeight="500" color="gray.200" lineHeight="1.4">
                {profile.currentWork.title}
              </Text>
              <Text fontSize="11px" color="gray.500">
                at {profile.currentWork.org}
              </Text>
            </Box>
          )}

          {/* Top skills */}
          <Box mb={4}>
            <Text
              fontSize="9px"
              color="gray.600"
              fontFamily="mono"
              letterSpacing="0.14em"
              mb={2}
              textTransform="uppercase"
            >
              Top Skills
            </Text>
            <Wrap spacing={1}>
              {profile.languages.slice(0, 5).map((lang) => (
                <WrapItem key={lang}>
                  <Tag
                    size="sm"
                    variant="subtle"
                    bg="rgba(10,102,194,0.12)"
                    color="#5b9bd5"
                    fontSize="10px"
                  >
                    {lang}
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          </Box>

          {/* Resume download (if configured) */}
          {profile.resumeUrl && (
            <Link
              href={profile.resumeUrl}
              isExternal
              _hover={{ textDecoration: "none" }}
              display="block"
              mb={2}
            >
              <Button
                w="full"
                size="sm"
                variant="outline"
                borderColor="rgba(255,255,255,0.14)"
                color="gray.300"
                fontFamily="mono"
                fontSize="11px"
                _hover={{
                  color: "gray.100",
                  borderColor: "rgba(255,255,255,0.3)",
                  bg: "rgba(255,255,255,0.05)",
                }}
              >
                ↓ download resume
              </Button>
            </Link>
          )}

          {/* Connect button */}
          <Link
            href={contact.link}
            isExternal
            _hover={{ textDecoration: "none" }}
            display="block"
          >
            <Button
              w="full"
              size="sm"
              bg="#0a66c2"
              color="white"
              fontWeight="600"
              rightIcon={<Icon as={FaArrowRight as ElementType} boxSize={3} />}
              _hover={{ bg: "#0959ab" }}
            >
              Connect on LinkedIn
            </Button>
          </Link>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

// ── Spotify — now-playing popover ─────────────────────────────────────────────

const EqualizerBars = () => (
  <HStack spacing="2px" h="10px" alignItems="flex-end">
    {[0, 0.15, 0.3].map((delay) => (
      <MotionBox
        key={delay}
        w="2px"
        bg="#1db954"
        borderRadius="1px"
        h="100%"
        animate={{ scaleY: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 0.75, delay, ease: "easeInOut" }}
        style={{ transformOrigin: "bottom" }}
      />
    ))}
  </HStack>
);

const SpotifyBadge = ({ contact }: { contact: Contact }) => {
  const [data, setData] = useState<NowPlaying | null>(null);
  const brand = BRAND.spotify;

  useEffect(() => {
    if (!contact.nowPlayingApi) return;
    let cancelled = false;

    const load = () => {
      fetch(contact.nowPlayingApi!)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!cancelled && d) setData(d);
        })
        .catch(() => {});
    };

    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [contact.nowPlayingApi]);

  if (!contact.nowPlayingApi || !data || (!data.isPlaying && !data.title)) {
    return <StandardBadge contact={contact} />;
  }

  return (
    <Popover placement="bottom-end" trigger="click" gutter={8}>
      <PopoverTrigger>
        <MotionBox
          as="button"
          position="relative"
          aria-label="Spotify · click for now playing"
          {...baseButtonProps(brand)}
          whileHover={{ scale: 1.1, y: -1 }}
          whileTap={{ scale: 0.93 }}
        >
          <Icon as={FaSpotify as ElementType} boxSize={4} />
          {data.isPlaying && (
            <Box
              position="absolute"
              top="3px"
              right="3px"
              w="6px"
              h="6px"
              borderRadius="full"
              bg="#1db954"
              boxShadow="0 0 6px rgba(29,185,84,0.7)"
              animation="live-dot 1.6s ease-in-out infinite"
            />
          )}
        </MotionBox>
      </PopoverTrigger>

      <PopoverContent
        bg="#0f0f10"
        borderColor="rgba(255,255,255,0.1)"
        boxShadow="0 12px 36px rgba(0,0,0,0.6)"
        w="300px"
        _focus={{ outline: "none", boxShadow: "0 12px 36px rgba(0,0,0,0.6)" }}
      >
        <PopoverArrow bg="#0f0f10" />
        <PopoverBody p={3}>
          <HStack spacing={3} align="flex-start">
            {data.albumImageUrl && (
              <Image
                src={data.albumImageUrl}
                alt={data.album || data.title}
                w="58px"
                h="58px"
                borderRadius="md"
                objectFit="cover"
                flexShrink={0}
              />
            )}
            <Box flex={1} minW={0}>
              <HStack spacing={2} mb={1}>
                <Icon as={FaSpotify as ElementType} boxSize={3} color="#1db954" />
                {data.isPlaying ? (
                  <HStack spacing={1.5}>
                    <EqualizerBars />
                    <Text
                      fontSize="9px"
                      color="#1db954"
                      fontFamily="mono"
                      fontWeight="700"
                      letterSpacing="0.08em"
                    >
                      NOW PLAYING
                    </Text>
                  </HStack>
                ) : (
                  <Text
                    fontSize="9px"
                    color="gray.500"
                    fontFamily="mono"
                    fontWeight="700"
                    letterSpacing="0.08em"
                  >
                    RECENTLY PLAYED
                  </Text>
                )}
              </HStack>
              <Text fontSize="sm" fontWeight="600" color="gray.100" noOfLines={1} title={data.title}>
                {data.title}
              </Text>
              <Text fontSize="xs" color="gray.500" noOfLines={1} title={data.artist}>
                {data.artist}
              </Text>
              <Link
                href={data.songUrl || contact.link}
                isExternal
                fontSize="10px"
                color="#1db954"
                mt={2}
                display="inline-flex"
                alignItems="center"
                gap={1}
                fontFamily="mono"
                _hover={{ textDecoration: "underline" }}
              >
                open in spotify →
              </Link>
            </Box>
          </HStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

const ContactBadges = ({ contacts, profile }: Props) => {
  return (
    <HStack spacing={0.5}>
      {contacts.map((contact) => {
        if (contact.id === "spotify") {
          return <SpotifyBadge key={contact.id} contact={contact} />;
        }
        if (contact.id === "linkedin") {
          return <LinkedInBadge key={contact.id} contact={contact} profile={profile} />;
        }
        return <StandardBadge key={contact.id} contact={contact} />;
      })}
    </HStack>
  );
};

export default ContactBadges;
