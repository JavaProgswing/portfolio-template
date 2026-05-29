import { Box } from "@chakra-ui/react";
import { useRef } from "react";
import Intro from "../components/Intro";
import Projects from "../components/Projects";
import Journey from "../components/Journey";
import Experience from "../components/Experience";
import Activity from "../components/Activity";
import Blog from "../components/Blog";

interface Props {
  data: any;
}

const HomePage = ({ data }: Props) => {
  const hasExperience = Array.isArray(data.experience) && data.experience.length > 0;

  const homeRef       = useRef<HTMLDivElement>(null);
  const journeyRef    = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<HTMLDivElement>(null);
  const projectsRef   = useRef<HTMLDivElement>(null);
  const activityRef   = useRef<HTMLDivElement>(null);
  const writingRef    = useRef<HTMLDivElement>(null);



  const scrollTo = (ref: React.RefObject<HTMLDivElement>) =>
    ref.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <Box>
        <Box maxW="780px" mx="auto" px={{ base: 5, md: 8 }}>
          <Box id="home" ref={homeRef} minH="100dvh"
            display="flex" alignItems="center" py={20}>
            <Intro data={data} currentWork={data.currentWork}
              resumeUrl={data.resumeUrl}
              onScrollDown={() => scrollTo(journeyRef)} />
          </Box>
          <Box id="journey" ref={journeyRef} py={24}>
            <Journey data={data} />
          </Box>
          {hasExperience && (
            <Box id="experience" ref={experienceRef} py={24}>
              <Experience experience={data.experience} />
            </Box>
          )}
          <Box id="projects" ref={projectsRef} py={24}>
            <Projects data={data} />
          </Box>
          <Box id="activity" ref={activityRef} py={24}>
            <Activity data={data} />
          </Box>
          <Box id="writing" ref={writingRef} py={24}>
            <Blog blogs={data.blogs} />
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default HomePage;
