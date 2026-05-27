import { HStack, IconButton, Link, Tooltip } from "@chakra-ui/react";
import { ElementType } from "react";
import { Icon } from "@chakra-ui/react";
import { getSiteIconUrl } from "../services/favicon-site-url";

interface Contact {
  id: string;
  name: string;
  site: string;
  link: string;
}

interface Props {
  contacts: Contact[];
}

const Socials = ({ contacts }: Props) => {
  return (
    <HStack justify="center" spacing={4}>
      {contacts.map((contact) => {
        const IconComponent = getSiteIconUrl(contact.id);
        return (
          <Tooltip key={contact.id} label={contact.name} hasArrow>
            <Link href={contact.link} isExternal>
              <IconButton
                aria-label={contact.name}
                icon={<Icon as={IconComponent as ElementType} />}
                variant="ghost"
              />
            </Link>
          </Tooltip>
        );
      })}
    </HStack>
  );
};

export default Socials;
