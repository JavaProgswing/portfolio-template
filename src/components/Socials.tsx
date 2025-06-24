import { HStack, IconButton, Link } from "@chakra-ui/react";
import { FaGithub, FaLinkedin, FaInstagram } from "react-icons/fa";

const Socials = () => (
  <HStack justify="center" spacing={4}>
    <Link href="https://github.com/JavaProgswing" isExternal>
      <IconButton aria-label="GitHub" icon={<FaGithub />} />
    </Link>
    <Link
      href="https://www.linkedin.com/in/yashasvi-allen-kujur-ba5a1533b/"
      isExternal
    >
      <IconButton aria-label="LinkedIn" icon={<FaLinkedin />} />
    </Link>
    <Link href="https://www.instagram.com/yashasviallen/" isExternal>
      <IconButton aria-label="Instagram" icon={<FaInstagram />} />
    </Link>
  </HStack>
);
export default Socials;
