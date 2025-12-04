import { Grid, GridItem, Show, Box } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import NavBar from "./components/NavBar";
import Intro from "./components/Intro";
import Projects from "./components/Projects";
import Journey from "./components/Journey";
import SectionNavigator from "./components/SectionNavigator";
import Footer from "./components/Footer";
import data from "./data/me";

function App() {
  const introRef = useRef<HTMLDivElement>(null);
  const journeyRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<"intro" | "journey" | "projects">(
    "intro"
  );

  useEffect(() => {
    const onScroll = () => {
      const threshold = window.innerHeight / 2;
      const introTop = introRef.current?.getBoundingClientRect().top ?? 0;
      const journeyTop = journeyRef.current?.getBoundingClientRect().top ?? 0;
      const projTop = projectsRef.current?.getBoundingClientRect().top ?? 0;

      if (Math.abs(introTop) < threshold) setActiveSection("intro");
      else if (Math.abs(journeyTop) < threshold) setActiveSection("journey");
      else if (Math.abs(projTop) < threshold) setActiveSection("projects");
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToIntro = () =>
    introRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToJourney = () =>
    journeyRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToProjects = () =>
    projectsRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <NavBar data={data} />

      {/* SectionNavigator on right for md+ screens */}
      {/* Note: You might need to update SectionNavigator to handle the new section */}
      <Show above="md">
        <SectionNavigator
          onIntroClick={scrollToIntro}
          onJourneyClick={scrollToJourney}
          onProjectsClick={scrollToProjects}
          activeSection={activeSection}
        />
      </Show>

      {/* Only apply margin to scrollable content (not Footer) */}
      <Box
        minHeight="100vh"
        mr={{ base: 0, md: "80px" }} // Matches navigator width
        transition="margin 0.3s ease"
      >
        <Grid
          templateRows="repeat(3, minmax(100vh, auto))"
          templateAreas={`
            "intro"
            "journey"
            "projects"
          `}
        >
          <GridItem
            area="intro"
            ref={introRef}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Intro data={data} onScrollDown={scrollToJourney} />
          </GridItem>

          <GridItem
            area="journey"
            ref={journeyRef}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Journey data={data} />
          </GridItem>

          <GridItem
            area="projects"
            ref={projectsRef}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Projects data={data} />
          </GridItem>
        </Grid>
      </Box>

      {/* Footer outside the margin */}
      <Footer />
    </>
  );
}

export default App;
