import { Box } from "@chakra-ui/react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useMemo, useRef } from "react";
import Intro from "../components/Intro";
import Projects from "../components/Projects";
import Journey from "../components/Journey";
import Experience from "../components/Experience";
import Activity from "../components/Activity";
import Blog from "../components/Blog";
import StatsStrip from "../components/StatsStrip";
import Marquee from "../components/Marquee";
import Reveal from "../components/Reveal";

const MotionBox = motion(Box);

interface Props {
  data: any;
}

const HomePage = ({ data }: Props) => {
  const hasExperience = Array.isArray(data.experience) && data.experience.length > 0;

  const journeyRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) =>
    ref.current?.scrollIntoView({ behavior: "smooth" });

  // hero glow drifts slower than the page for a bit of depth
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const glowY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const ghOwner: string = useMemo(() => {
    const link = (data.contacts || []).find((c: { id: string }) => c.id === "github")?.link || "";
    return data.lab?.defaultUser || link.match(/github\.com\/([^/?#]+)/i)?.[1] || "";
  }, [data]);

  const techItems = useMemo(() => {
    const fw = data.frameworks || {};
    const names: string[] = [
      ...(data.languages || []),
      ...Object.values(fw).flatMap((arr) => (Array.isArray(arr) ? arr.map((x: { name: string }) => x.name) : [])),
    ];
    return [...new Set(names)];
  }, [data]);

  return (
    <Box>
      <Box maxW="780px" mx="auto" px={{ base: 5, md: 8 }}>
        <Box id="home" ref={heroRef} minH="100dvh" display="flex" alignItems="center" py={20} position="relative">
          <MotionBox
            aria-hidden position="absolute" top="8%" left="50%" w="min(720px, 100%)" h="420px" pointerEvents="none"
            style={{ y: glowY, opacity: glowOpacity, x: "-50%" }}
            bgGradient="radial(closest-side, rgba(var(--brand-rgb),0.22), transparent)"
            filter="blur(30px)" zIndex={0}
          />
          <Box position="relative" zIndex={1} w="100%">
            <Intro data={data} currentWork={data.currentWork} resumeUrl={data.resumeUrl}
              onScrollDown={() => scrollTo(journeyRef)} />
          </Box>
        </Box>
      </Box>

      <Box maxW="1100px" mx="auto" px={{ base: 0, md: 8 }}>
        <Marquee items={techItems} />
      </Box>

      <Box maxW="780px" mx="auto" px={{ base: 5, md: 8 }} pt={10}>
        <Reveal>
          <StatsStrip posts={(data.blogs || []).length} owner={ghOwner} lab={data.lab} />
        </Reveal>
      </Box>

      <Box maxW="780px" mx="auto" px={{ base: 5, md: 8 }}>
        <Box id="journey" ref={journeyRef} py={24}>
          <Reveal><Journey data={data} /></Reveal>
        </Box>
        {hasExperience && (
          <Box id="experience" py={24}>
            <Reveal><Experience experience={data.experience} /></Reveal>
          </Box>
        )}
        <Box id="projects" py={24}>
          <Reveal><Projects data={data} /></Reveal>
        </Box>
        <Box id="activity" py={24}>
          <Reveal><Activity data={data} /></Reveal>
        </Box>
        <Box id="writing" py={24}>
          <Reveal><Blog blogs={data.blogs || []} /></Reveal>
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;
