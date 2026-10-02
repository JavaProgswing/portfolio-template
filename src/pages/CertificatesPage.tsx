import { Box, Heading, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import Certificates from "../components/Certificates";

const CertificatesPage = () => (
  <Box maxW="900px" mx="auto" px={{ base: 5, md: 8 }} py={{ base: 14, md: 20 }}>
    <Text as={RouterLink} to="/" fontSize="11px" color="brand.400" fontFamily="mono" display="inline-block" mb={6}>
      ← back to home
    </Text>
    <Text fontSize="11px" fontFamily="mono" color="fg.subtle" letterSpacing="0.14em" mb={2} textTransform="uppercase">
      Certificates
    </Text>
    <Heading size="2xl" mb={3} className="grad-text">Proof of work</Heading>
    <Text color="fg.muted" maxW="560px" mb={10} lineHeight="1.75">
      Hackathon results and course certifications, each with the original certificate and a verification link where one exists.
    </Text>
    <Certificates heading="Everything" />
  </Box>
);

export default CertificatesPage;
