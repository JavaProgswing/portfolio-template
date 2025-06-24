import { HStack, IconButton, Link } from "@chakra-ui/react";
import { FunctionComponent } from "react";
import { IconBaseProps } from "react-icons";
import { FaGithub, FaLinkedin, FaInstagram } from "react-icons/fa";

const Socials = () => {
  const FaGithubIcon = FaGithub as FunctionComponent<IconBaseProps>;
  const FaLinkedinIcon = FaLinkedin as FunctionComponent<IconBaseProps>;
  const FaInstagramIcon = FaInstagram as FunctionComponent<IconBaseProps>;
  return (
    <HStack justify="center" spacing={4}>
      <Link href="https://github.com/JavaProgswing" isExternal>
        <IconButton aria-label="GitHub" icon={<FaGithubIcon />} />
      </Link>
      <Link
        href="https://www.linkedin.com/in/yashasvi-allen-kujur-ba5a1533b/"
        isExternal
      >
        <IconButton aria-label="LinkedIn" icon={<FaLinkedinIcon />} />
      </Link>
      <Link href="https://www.instagram.com/yashasviallen/" isExternal>
        <IconButton aria-label="Instagram" icon={<FaInstagramIcon />} />
      </Link>
    </HStack>
  );
};
export default Socials;
