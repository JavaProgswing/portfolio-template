import { Box, Grid, GridItem, Show } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import NavBar from "./components/NavBar";
import Intro from "./components/Intro";
import Projects from "./components/Projects";
import Journey from "./components/Journey";
import SectionNavigator, { Section } from "./components/SectionNavigator";
import Footer from "./components/Footer";
import ParticleBackground from "./components/ParticleBackground";
import CurrentlyBuilding from "./components/CurrentlyBuilding";
import CPStats from "./components/CPStats";
import Blog from "./components/Blog";
import OllamaChat from "./components/OllamaChat";
import data from "./data/me";

function App() {
  useEffect(() => {
    document.title = data.name;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", data.desc_brief);
  }, []);
  const introRef = useRef<HTMLDivElement>(null);
  const buildingRef = useRef<HTMLDivElement>(null);
  const cpRef = useRef<HTMLDivElement>(null);
  const journeyRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef<HTMLDivElement>(null);
  const blogRef = useRef<HTMLDivElement>(null);

  const [activeSection, setActiveSection] = useState<Section>("intro");

  useEffect(() => {
    const refs: [React.RefObject<HTMLDivElement>, Section][] = [
      [introRef, "intro"],
      [buildingRef, "building"],
      [cpRef, "cp"],
      [journeyRef, "journey"],
      [projectsRef, "projects"],
      [blogRef, "blog"],
    ];

    const onScroll = () => {
      const threshold = window.innerHeight * 0.45;
      let closest: Section = "intro";
      let minDist = Infinity;

      for (const [ref, id] of refs) {
        const top = ref.current?.getBoundingClientRect().top ?? Infinity;
        const dist = Math.abs(top);
        if (dist < minDist) {
          minDist = dist;
          closest = id;
        }
      }

      // Prefer sections whose top is in the upper half of viewport
      for (const [ref, id] of refs) {
        const top = ref.current?.getBoundingClientRect().top ?? Infinity;
        if (top >= 0 && top < threshold) {
          closest = id;
          break;
        }
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
            onIntroClick={() => scrollTo(introRef)}
            onBuildingClick={() => scrollTo(buildingRef)}
            onCpClick={() => scrollTo(cpRef)}
            onJourneyClick={() => scrollTo(journeyRef)}
            onProjectsClick={() => scrollTo(projectsRef)}
            onBlogClick={() => scrollTo(blogRef)}
            activeSection={activeSection}
          />
        </Show>

        <Box
          minHeight="100vh"
          mr={{ base: 0, md: "72px" }}
          transition="margin 0.3s ease"
        >
          <Grid
            templateRows="repeat(6, minmax(100vh, auto))"
            templateAreas={`
              "intro"
              "building"
              "cp"
              "journey"
              "projects"
              "blog"
            `}
          >
            <GridItem
              area="intro"
              id="intro"
              ref={introRef}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Intro data={data} onScrollDown={() => scrollTo(buildingRef)} />
            </GridItem>

            <GridItem
              area="building"
              id="building"
              ref={buildingRef}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <CurrentlyBuilding currentWork={data.currentWork} />
            </GridItem>

            <GridItem
              area="cp"
              id="cp"
              ref={cpRef}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <CPStats
                cfHandle={data.cp.codeforces}
                lcHandle={data.cp.leetcode}
              />
            </GridItem>

            <GridItem
              area="journey"
              id="journey"
              ref={journeyRef}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Journey data={data} />
            </GridItem>

            <GridItem
              area="projects"
              id="projects"
              ref={projectsRef}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Projects data={data} />
            </GridItem>

            <GridItem
              area="blog"
              id="blog"
              ref={blogRef}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Blog blogs={data.blogs} />
            </GridItem>
          </Grid>
        </Box>

        <Footer name={data.name} />
      </Box>

      <OllamaChat data={data} />
    </>
  );
}

export default App;
