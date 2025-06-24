import { HStack, IconButton } from "@chakra-ui/react";
import { getSiteIconUrl } from "../services/favicon-site-url";
import { FaQuestion } from "react-icons/fa";
import { FunctionComponent, ReactElement } from "react";
import { IconBaseProps } from "react-icons";

interface ContactBadge {
  id: string;
  site: string;
  link: string;
}

interface Props {
  contacts: ContactBadge[];
}

const ContactBadges = ({ contacts }: Props) => {
  return (
    <HStack>
      {contacts.map((contact) => {
        const IconComponent = (getSiteIconUrl(contact.id) ||
          FaQuestion) as FunctionComponent<IconBaseProps>;
        return (
          <IconButton
            key={contact.id}
            as="a"
            href={contact.link}
            aria-label={contact.id}
            variant="ghost"
            size="md"
            icon={<IconComponent />}
          />
        );
      })}
    </HStack>
  );
};

export default ContactBadges;
