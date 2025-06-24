import { Box, Heading, HStack } from "@chakra-ui/react";
import { Info } from "./Intro";
import ContactBadges from "./ContactBadges";
import ColorModeToggle from "./ColorModeToggle";

interface Props {
  data: Info;
}

const Navbar = ({ data }: Props) => {
  return (
    <Box position="relative" w="100%" px={5} py={3}>
      <HStack justifyContent="space-between" w="100%">
        {/* Left */}
        <Heading
          as="h1"
          size="md"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          ~
        </Heading>

        {/* Right */}
        <ColorModeToggle />
      </HStack>

      {/* Center - absolute, overlaid in the middle */}
      <Box position="absolute" left="50%" transform="translateX(-50%)">
        <ContactBadges contacts={data.contacts} />
      </Box>
    </Box>
  );
};

export default Navbar;
