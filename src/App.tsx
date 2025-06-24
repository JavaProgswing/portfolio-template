import { Grid, GridItem, useDisclosure } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import NavBar from "./components/NavBar";
import Intro from "./components/Intro";
import Projects from "./components/Projects";
import SectionNavigator from "./components/SectionNavigator";
import data from "./data/me";

function App() {
  const introRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<"intro" | "projects">(
    "intro"
  );

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const threshold = window.innerHeight / 2;
      const introTop = introRef.current?.getBoundingClientRect().top ?? 0;
      const projTop = projectsRef.current?.getBoundingClientRect().top ?? 0;

      if (Math.abs(introTop) < threshold) setActiveSection("intro");
      else if (Math.abs(projTop) < threshold) setActiveSection("projects");
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToIntro = () =>
    introRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToProjects = () =>
    projectsRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <NavBar data={data} />
      <SectionNavigator
        onIntroClick={scrollToIntro}
        onProjectsClick={scrollToProjects}
        activeSection={activeSection}
      />

      <Grid
        height="200vh" // 2 full screens
        templateRows="repeat(2, 100vh)"
        templateAreas={`"intro" "projects"`}
      >
        <GridItem
          area="intro"
          ref={introRef}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Intro data={data} onScrollDown={scrollToProjects} />
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
    </>
  );
}

export default App;
