import { Heading, HStack } from "@chakra-ui/react";
import { Info } from "./Intro";
import ContactBadges from "./ContactBadges";
import ColorModeToggle from "./ColorModeToggle";

interface Props {
  data: Info;
}
const Navbar = ({ data }: Props) => {
  return (
    <>
      <HStack padding={"10px"} justifyContent="space-between" paddingX={5}>
        <Heading
          as="h1"
          size="md"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
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
