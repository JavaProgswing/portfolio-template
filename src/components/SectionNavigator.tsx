import { Box, Tooltip } from "@chakra-ui/react";

export type Section = "home" | "journey" | "experience" | "projects" | "activity" | "writing";

interface Props {
  onHomeClick: () => void;
  onJourneyClick: () => void;
  onExperienceClick?: () => void;
  onProjectsClick: () => void;
  onActivityClick: () => void;
  onWritingClick: () => void;
  activeSection: Section;
}

const ITEMS: { id: Section; label: string }[] = [
  { id: "home",       label: "Home" },
  { id: "journey",    label: "Journey" },
  { id: "experience", label: "Experience" },
  { id: "projects",   label: "Projects" },
  { id: "activity",   label: "Activity" },
  { id: "writing",    label: "Writing" },
];

const SectionNavigator = ({
  onHomeClick, onJourneyClick, onExperienceClick, onProjectsClick, onActivityClick, onWritingClick,
  activeSection,
}: Props) => {
  const handlers: Partial<Record<Section, () => void>> = {
    home: onHomeClick,
    journey: onJourneyClick,
    experience: onExperienceClick,
    projects: onProjectsClick,
    activity: onActivityClick,
    writing: onWritingClick,
  };

  return (
    <Box
      position="fixed" right="28px" top="50%" transform="translateY(-50%)"
      display="flex" flexDirection="column" gap={5} zIndex={10}
    >
      {ITEMS.filter(item => handlers[item.id]).map(item => {
        const active = activeSection === item.id;
        return (
          <Tooltip key={item.id} label={item.label} placement="left" hasArrow
            bg="gray.800" color="white" fontSize="11px" fontFamily="mono">
            <Box
              as="button" onClick={handlers[item.id]}
              w={active ? "8px" : "6px"} h={active ? "8px" : "6px"}
              borderRadius="full"
              bg={active ? "brand.400" : "gray.700"}
              transition="all 0.2s ease"
              _hover={{ transform: "scale(1.5)", bg: active ? "brand.300" : "gray.500" }}
              boxShadow={active ? "0 0 8px rgba(99,102,241,0.6)" : "none"}
            />
          </Tooltip>
        );
      })}
    </Box>
  );
};

export default SectionNavigator;
