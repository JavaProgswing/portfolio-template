import {
  Box,
  HStack,
  Link,
  Show,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { Info } from "./Intro";
import ContactBadges from "./ContactBadges";
import ColorModeToggle from "./ColorModeToggle";

interface Props {
  data: Info;
}

const NAV_LINKS = [
  { label: "about", href: "#intro" },
  { label: "now", href: "#building" },
  { label: "cp", href: "#cp" },
  { label: "journey", href: "#journey" },
  { label: "projects", href: "#projects" },
  { label: "writing", href: "#blog" },
];

const Navbar = ({ data }: Props) => {
  const bg = useColorModeValue(
    "rgba(249,249,249,0.85)",
    "rgba(10,10,10,0.85)"
  );
  const borderCol = useColorModeValue(
    "rgba(0,0,0,0.06)",
    "rgba(255,255,255,0.06)"
  );

  return (
    <HStack
      position="sticky"
      top="0"
      zIndex={100}
      bg={bg}
      backdropFilter="blur(14px)"
      borderBottom="1px solid"
      borderColor={borderCol}
      px={5}
      py={3}
      justifyContent="space-between"
    >
      {/* Logo */}
      <Text
        as="a"
        href="#intro"
        fontFamily="mono"
        fontWeight="600"
        fontSize="md"
        color="blue.400"
        _hover={{ color: "blue.300", textDecoration: "none" }}
        letterSpacing="0.05em"
        cursor="pointer"
        flexShrink={0}
      >
        ~/{data.name.split(" ")[0].toLowerCase()}
      </Text>

      {/* Section links (md+) */}
      <Show above="md">
        <HStack spacing={1}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              px={3}
              py={1}
              borderRadius="md"
              fontSize="xs"
              fontFamily="mono"
              color="gray.400"
              _hover={{
                color: "blue.400",
                bg: "rgba(0,127,255,0.08)",
                textDecoration: "none",
              }}
              transition="all 0.15s"
            >
              {link.label}
            </Link>
          ))}
        </HStack>
      </Show>

      <HStack spacing={2} flexShrink={0}>
        <ContactBadges contacts={data.contacts} />
        <Box w="1px" h="18px" bg={borderCol} />
        <ColorModeToggle />
      </HStack>
    </HStack>
  );
};

export default Navbar;
