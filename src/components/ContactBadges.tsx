import { HStack, IconButton } from "@chakra-ui/react";
import { getSiteIconUrl } from "../services/favicon-site-url";

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
        const Icon = getSiteIconUrl(contact.id);

        return (
          <IconButton
            key={contact.id}
            as="a"
            href={contact.link}
            aria-label={contact.id}
            variant="ghost"
            size="md"
            icon={Icon ? <Icon /> : undefined}
          />
        );
      })}
    </HStack>
  );
};

export default ContactBadges;
