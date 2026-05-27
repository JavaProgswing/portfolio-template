import { Box, Show } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import NavBar from "./components/NavBar";
import Intro from "./components/Intro";
import Projects from "./components/Projects";
import Journey from "./components/Journey";
import SectionNavigator, { Section } from "./components/SectionNavigator";
import Footer from "./components/Footer";
import ParticleBackground from "./components/ParticleBackground";
import Activity from "./components/Activity";
import Blog from "./components/Blog";
import OllamaChat from "./components/OllamaChat";
import EasterEggs from "./components/EasterEggs";
import data from "./data/me";

function App() {
  useEffect(() => {
    document.title = data.name;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", data.desc_brief);
  }, []);

  const homeRef     = useRef<HTMLDivElement>(null);
  const journeyRef  = useRef<HTMLDivElement>(null);
  const projectsRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);
  const writingRef  = useRef<HTMLDivElement>(null);

  const [activeSection, setActiveSection] = useState<Section>("home");

  useEffect(() => {
    const refs: [React.RefObject<HTMLDivElement>, Section][] = [
      [homeRef, "home"],
      [journeyRef, "journey"],
      [projectsRef, "projects"],
      [activityRef, "activity"],
      [writingRef, "writing"],
    ];

    const onScroll = () => {
      const mid = window.innerHeight * 0.4;
      let closest: Section = "home";
      let minDist = Infinity;

      for (const [ref, id] of refs) {
        const top = ref.current?.getBoundingClientRect().top ?? Infinity;
        const dist = Math.abs(top - mid);
        if (dist < minDist) { minDist = dist; closest = id; }
      }

      setActiveSection(closest);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) =>
    ref.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <ParticleBackground />

      <Box position="relative" zIndex={1}>
        <NavBar data={data} />

        <Show above="md">
          <SectionNavigator
            onHomeClick={()     => scrollTo(homeRef)}
            onJourneyClick={()  => scrollTo(journeyRef)}
            onProjectsClick={()  => scrollTo(projectsRef)}
            onActivityClick={()  => scrollTo(activityRef)}
            onWritingClick={()   => scrollTo(writingRef)}
            activeSection={activeSection}
          />
        </Show>

        {/* Main content — max-width document flow, not forced 100vh */}
        <Box mr={{ base: 0, md: "60px" }}>
          <Box maxW="780px" mx="auto" px={{ base: 5, md: 8 }}>

            {/* Hero — full viewport */}
            <Box
              id="home" ref={homeRef}
              minH="100vh"
              display="flex" alignItems="center"
              py={20}
            >
              <Intro
                data={data}
                currentWork={data.currentWork}
                onScrollDown={() => scrollTo(journeyRef)}
              />
            </Box>

            {/* Journey */}
            <Box id="journey" ref={journeyRef} py={24}>
              <Journey data={data} />
            </Box>

            {/* Projects */}
            <Box id="projects" ref={projectsRef} py={24}>
              <Projects data={data} />
            </Box>

            {/* Activity */}
            <Box id="activity" ref={activityRef} py={24}>
              <Activity data={data} />
            </Box>

            {/* Writing */}
            <Box id="writing" ref={writingRef} py={24}>
              <Blog blogs={data.blogs} />
            </Box>

          </Box>
        </Box>

        <Footer name={data.name} />
      </Box>

      <OllamaChat data={data} />
      <EasterEggs />
    </>
  );
}

export default App;
