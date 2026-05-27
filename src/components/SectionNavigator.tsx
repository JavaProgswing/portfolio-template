import { Box, Tooltip } from "@chakra-ui/react";

export type Section =
  | "intro"
  | "building"
  | "cp"
  | "journey"
  | "projects"
  | "blog";

interface Props {
  onIntroClick: () => void;
  onBuildingClick: () => void;
  onCpClick: () => void;
  onJourneyClick: () => void;
  onProjectsClick: () => void;
  onBlogClick: () => void;
  activeSection: Section;
}

const ITEMS: { id: Section; label: string }[] = [
  { id: "intro", label: "About" },
  { id: "building", label: "Now" },
  { id: "cp", label: "CP" },
  { id: "journey", label: "Journey" },
  { id: "projects", label: "Projects" },
  { id: "blog", label: "Writing" },
];

const SectionNavigator = ({
  onIntroClick,
  onBuildingClick,
  onCpClick,
  onJourneyClick,
  onProjectsClick,
  onBlogClick,
  activeSection,
}: Props) => {
  const handlers: Record<Section, () => void> = {
    intro: onIntroClick,
    building: onBuildingClick,
    cp: onCpClick,
    journey: onJourneyClick,
    projects: onProjectsClick,
    blog: onBlogClick,
  };

  return (
    <Box
      position="fixed"
      right="32px"
      top="50%"
      transform="translateY(-50%)"
      display="flex"
      flexDirection="column"
      gap={5}
      zIndex={10}
    >
      {ITEMS.map((item) => {
        const isActive = activeSection === item.id;
        return (
          <Tooltip
            key={item.id}
            label={item.label}
            placement="left"
            hasArrow
            bg="gray.800"
            color="white"
            fontSize="xs"
            fontFamily="mono"
          >
            <Box
              as="button"
              onClick={handlers[item.id]}
              w={isActive ? "10px" : "8px"}
              h={isActive ? "10px" : "8px"}
              borderRadius="full"
              bg={isActive ? "blue.400" : "gray.600"}
              transition="all 0.25s ease"
              _hover={{
                transform: "scale(1.4)",
                bg: isActive ? "blue.300" : "gray.400",
              }}
              boxShadow={
                isActive ? "0 0 10px rgba(66,153,225,0.7)" : "none"
              }
            />
          </Tooltip>
        );
      })}
    </Box>
  );
};

export default SectionNavigator;
