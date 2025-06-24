import { VStack, IconButton, Box, useColorModeValue } from "@chakra-ui/react";
import { FaUser, FaCode } from "react-icons/fa";

interface Props {
  onIntroClick: () => void;
  onProjectsClick: () => void;
  activeSection: "intro" | "projects";
}

const SectionNavigator = ({
  onIntroClick,
  onProjectsClick,
  activeSection,
}: Props) => {
  const activeBorder = "2px solid white";
  const inactiveBorder = "2px solid transparent";
  const iconBg = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      position="fixed"
      right={4}
      top="50%"
      transform="translateY(-50%)"
      zIndex={10}
    >
      <VStack spacing={4}>
        <IconButton
          aria-label="Go to Intro"
          icon={<FaUser />}
          onClick={onIntroClick}
          h="100px"
          w="50px"
          bg={activeSection === "intro" ? iconBg : "transparent"}
          border={activeSection === "intro" ? activeBorder : inactiveBorder}
          borderRadius="md"
        />
        <IconButton
          aria-label="Go to Projects"
          icon={<FaCode />}
          onClick={onProjectsClick}
          h="100px"
          w="50px"
          bg={activeSection === "projects" ? iconBg : "transparent"}
          border={activeSection === "projects" ? activeBorder : inactiveBorder}
          borderRadius="md"
        />
      </VStack>
    </Box>
  );
};

export default SectionNavigator;
