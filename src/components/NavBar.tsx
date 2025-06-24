import { Box, Heading, HStack, Spacer } from "@chakra-ui/react";
import { Info } from "./Intro";
import ContactBadges from "./ContactBadges";
import ColorModeToggle from "./ColorModeToggle";

interface Props {
  data: Info;
}

const Navbar = ({ data }: Props) => {
  return (
    <HStack w="100%" px={5} py={3}>
      {/* Left Item */}
      <Heading
        as="h1"
        size="md"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        ~
      </Heading>

      {/* Center Item (ContactBadges) */}
      <Box flex="1" display="flex" justifyContent="center">
        <ContactBadges contacts={data.contacts} />
      </Box>

      {/* Right Item */}
      <ColorModeToggle />
    </HStack>
  );
};

export default Navbar;
