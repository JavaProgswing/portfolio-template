import { Heading, HStack, useColorModeValue } from "@chakra-ui/react";
import { Info } from "./Intro";
import ContactBadges from "./ContactBadges";
import ColorModeToggle from "./ColorModeToggle";

interface Props {
  data: Info;
}
const Navbar = ({ data }: Props) => {
  return (
    <>
      <HStack
        position="sticky"
        top="0"
        zIndex="100"
        bg={useColorModeValue("gray.200", "gray.900")}
        px={5}
        py={3}
        justifyContent="space-between"
      >
        <Heading
          as="h1"
          size="md"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          paddingLeft={2}
        >
          ~
        </Heading>
        <ContactBadges contacts={data.contacts} />
        <ColorModeToggle />
      </HStack>
    </>
  );
};

export default Navbar;
