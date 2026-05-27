import {
  Box,
  HStack,
  Link,
  Show,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { Info } from "./Intro";
import ContactBadges from "./ContactBadges";
import ColorModeToggle from "./ColorModeToggle";
import ThemeSwitcher from "./ThemeSwitcher";
import Confetti from "./Confetti";
import { unlock } from "../lib/achievements";

interface Props {
  data: Info & {
    currentWork?: { title: string; org: string };
  };
}

const NAV = [
  { label: "about",    href: "#home" },
  { label: "journey",  href: "#journey" },
  { label: "projects", href: "#projects" },
  { label: "activity", href: "#activity" },
  { label: "writing",  href: "#writing" },
];

const Navbar = ({ data }: Props) => {
  const bg = useColorModeValue("rgba(250,250,250,0.85)", "rgba(9,9,11,0.88)");
  const border = useColorModeValue("rgba(0,0,0,0.07)", "rgba(255,255,255,0.06)");
  const toast = useToast();

  const clicksRef = useRef<number[]>([]);
  const [confettiKey, setConfettiKey] = useState(0);

  const handleLogoClick = () => {
    const now = Date.now();
    clicksRef.current = [...clicksRef.current.filter((t) => now - t < 3000), now];
    if (clicksRef.current.length >= 5) {
      clicksRef.current = [];
      setConfettiKey((k) => k + 1);
      unlock("logo-burst");
      toast({
        title: "🎉 you found it",
        description: "5 clicks · keep exploring",
        status: "success",
        duration: 2500,
        position: "bottom-left",
        variant: "subtle",
      });
    }
  };

  return (
    <>
      <HStack
        position="sticky" top="0" zIndex={100}
        bg={bg} backdropFilter="blur(14px)"
        borderBottom="1px solid" borderColor={border}
        px={6} py={3}
        justifyContent="space-between"
      >
        <Text
          as="a" href="#home"
          onClick={handleLogoClick}
          fontFamily="mono" fontWeight="600" fontSize="sm"
          color="brand.400" letterSpacing="0.04em"
          _hover={{ color: "brand.300", textDecoration: "none" }}
          cursor="pointer" flexShrink={0}
          userSelect="none"
        >
          ~/{data.name.split(" ")[0].toLowerCase()}
        </Text>

        <Show above="md">
          <HStack spacing={0.5}>
            {NAV.map(n => (
              <Link
                key={n.href} href={n.href}
                px={3} py={1} borderRadius="md"
                fontSize="12px" fontFamily="mono" color="gray.500"
                _hover={{ color: "gray.100", bg: "rgba(255,255,255,0.05)", textDecoration: "none" }}
                transition="all 0.15s"
              >
                {n.label}
              </Link>
            ))}
          </HStack>
        </Show>

        <HStack spacing={1} flexShrink={0}>
          <ContactBadges
            contacts={data.contacts}
            profile={{
              name: data.name,
              image: data.image,
              tags: data.tags,
              languages: data.languages,
              currentWork: data.currentWork
                ? { title: data.currentWork.title, org: data.currentWork.org }
                : undefined,
            }}
          />
          <Box w="1px" h="14px" bg={border} mx={1} />
          <ThemeSwitcher />
          <ColorModeToggle />
        </HStack>
      </HStack>

      <Confetti trigger={confettiKey} />
    </>
  );
};

export default Navbar;
