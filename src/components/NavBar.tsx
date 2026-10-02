import {
  Box,
  HStack,
  Icon,
  IconButton,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Hide,
  Show,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { Info } from "./Intro";
import ContactBadges from "./ContactBadges";
import ColorModeToggle from "./ColorModeToggle";
import ThemeSwitcher, { SoundToggle } from "./ThemeSwitcher";
import Confetti from "./Confetti";
import { unlock } from "../lib/achievements";
import { resolveInitialTheme, isMinimalTheme } from "../themes/palettes";

interface Props {
  data: Info & {
    currentWork?: { title: string; org: string };
    resumeUrl?: string;
  };
}

const Navbar = ({ data }: Props) => {
  const hasExperience =
    Array.isArray((data as any).experience) && (data as any).experience.length > 0;

  const NAV = [
    { label: "about",    href: "#home" },
    { label: "journey",  href: "#journey" },
    ...(hasExperience ? [{ label: "experience", href: "#experience" }] : []),
    { label: "projects", href: "#projects" },
    { label: "activity", href: "#activity" },
    { label: "writing",  href: "#writing" },
  ];
  const PAGES = [
    { label: "blog", to: "/blog" },
    { label: "lab",  to: "/lab" },
    { label: "certs", to: "/certificates" },
  ];

  const location = useLocation();
  const navigate = useNavigate();
  const goSection = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    const id = href.slice(1);
    if (location.pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  };
  const [activeId, setActiveId] = useState("home");
  useEffect(() => {
    if (location.pathname !== "/") return;
    const els = NAV.map((n) => document.getElementById(n.href.slice(1))).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActiveId(e.target.id); }),
      { rootMargin: "-40% 0px -55% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(to + "/");

  const bg = "color-mix(in srgb, var(--bg-base) 86%, transparent)";
  const border = "var(--border)";
  const toast = useToast();

  const clicksRef = useRef<number[]>([]);
  const [confettiKey, setConfettiKey] = useState(0);

  // Light toggle only applies to minimal themes; hide it on dark-only themes.
  const [theme, setTheme] = useState(resolveInitialTheme);
  useEffect(() => {
    const onThemeChange = (e: Event) =>
      setTheme((e as CustomEvent<string>).detail);
    window.addEventListener("themechange", onThemeChange);
    return () => window.removeEventListener("themechange", onThemeChange);
  }, []);

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
          as="a" href="/"
          onClick={(e: React.MouseEvent) => { handleLogoClick(); if (location.pathname !== "/") { e.preventDefault(); navigate("/"); } else { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); } }}
          fontFamily="mono" fontWeight="600" fontSize="sm"
          color="brand.400" letterSpacing="0.04em"
          _hover={{ color: "brand.300", textDecoration: "none" }}
          cursor="pointer" flexShrink={0}
          userSelect="none"
        >
          ~/{data.name.split(" ")[0].toLowerCase()}
        </Text>

        <Show above="lg">
          <HStack spacing={0.5}>
            {NAV.map(n => (
              <Link
                key={n.href} href={"/" + n.href} onClick={(e) => goSection(e, n.href)}
                px={3} py={1} borderRadius="md"
                fontSize="12px" fontFamily="mono"
                color={location.pathname === "/" && activeId === n.href.slice(1) ? "brand.400" : "gray.500"}
                bg={location.pathname === "/" && activeId === n.href.slice(1) ? "rgba(var(--brand-rgb),0.1)" : undefined}
                _hover={{ color: "fg.strong", bg: "rgba(var(--brand-rgb),0.06)", textDecoration: "none" }}
                transition="all 0.15s"
              >
                {n.label}
              </Link>
            ))}
            <Box w="1px" h="14px" bg={border} mx={1} />
            {PAGES.map(n => (
              <Link
                key={n.to} as={RouterLink} to={n.to}
                px={3} py={1} borderRadius="md"
                fontSize="12px" fontFamily="mono"
                color={isActive(n.to) ? "brand.400" : "gray.400"}
                bg={isActive(n.to) ? "rgba(255,255,255,0.06)" : undefined}
                _hover={{ color: "brand.300", bg: "rgba(255,255,255,0.05)", textDecoration: "none" }}
                transition="all 0.15s"
              >
                {n.label}
              </Link>
            ))}
          </HStack>
        </Show>

        <HStack spacing={1} flexShrink={0}>
          <Box display={{ base: "none", md: "block" }}>
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
              resumeUrl: data.resumeUrl,
            }}
          />
          </Box>
          <Hide above="lg">
            <Menu placement="bottom-end">
              <MenuButton as={IconButton} aria-label="Menu" size="sm" variant="ghost" icon={<Icon as={FaBars as React.ElementType} />} />
              <MenuList fontFamily="mono" fontSize="12px" zIndex={200}>
                {PAGES.map(n => (
                  <MenuItem key={n.to} as={RouterLink} to={n.to}>{n.label}</MenuItem>
                ))}
                {NAV.map(n => (
                  <MenuItem key={n.href} onClick={(e) => goSection(e as unknown as React.MouseEvent, n.href)}>{n.label}</MenuItem>
                ))}
                <Box display={{ base: "block", md: "none" }} borderTop="1px solid var(--border)" mt={1} pt={1}>
                  {data.contacts.map((c: { id: string; name: string; link: string }) => (
                    <MenuItem key={c.id} as="a" href={c.link} target="_blank" rel="noopener noreferrer" color="fg.muted">
                      {c.name.toLowerCase()} ↗
                    </MenuItem>
                  ))}
                </Box>
              </MenuList>
            </Menu>
          </Hide>
          <Box w="1px" h="14px" bg={border} mx={1} />
          <SoundToggle />
          <ThemeSwitcher />
          {isMinimalTheme(theme) && <ColorModeToggle />}
        </HStack>
      </HStack>

      <Confetti trigger={confettiKey} />
    </>
  );
};

export default Navbar;
