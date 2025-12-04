import { Box, Tooltip } from "@chakra-ui/react";

interface Props {
  onIntroClick: () => void;
  onJourneyClick: () => void;
  onProjectsClick: () => void;
  activeSection: "intro" | "journey" | "projects";
}

const SectionNavigator = ({
  onIntroClick,
  onJourneyClick,
  onProjectsClick,
  activeSection,
}: Props) => {
  const navItems = [
    { id: "intro", label: "Intro", onClick: onIntroClick },
    { id: "journey", label: "Journey", onClick: onJourneyClick },
    { id: "projects", label: "Projects", onClick: onProjectsClick },
  ];

  return (
    <Box
      position="fixed"
      right="40px"
      top="50%"
      transform="translateY(-50%)"
      display="flex"
      flexDirection="column"
      gap={6}
      zIndex={10}
    >
      {navItems.map((item) => (
        <Tooltip
          key={item.id}
          label={item.label}
          placement="left"
          hasArrow
          bg="gray.700"
          color="white"
        >
          <Box
            as="button"
            onClick={item.onClick}
            w="12px"
            h="12px"
            borderRadius="full"
            bg={activeSection === item.id ? "blue.400" : "gray.600"}
            transition="all 0.3s ease"
            _hover={{
              transform: "scale(1.5)",
              bg: activeSection === item.id ? "blue.300" : "gray.400",
            }}
            boxShadow={
              activeSection === item.id
                ? "0 0 10px rgba(66, 153, 225, 0.6)"
                : "none"
            }
          />
        </Tooltip>
      ))}
    </Box>
  );
};

export default SectionNavigator;
