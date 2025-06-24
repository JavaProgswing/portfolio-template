import { Box, Flex, Text, useColorModeValue } from "@chakra-ui/react";
import { useEffect, useState } from "react";

const Footer = () => {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const textColor = useColorModeValue("gray.600", "gray.400");

  return (
    <Box
      w="100%"
      borderTop="1px solid"
      borderColor={useColorModeValue("gray.200", "gray.700")}
      py={4}
      px={6}
      mt={10}
    >
      <Flex justify="space-between" align="center" flexWrap="wrap">
        <Text fontSize="sm" color={textColor}>
          Made by Yashasvi © 2025 – Present. All rights reserved.
        </Text>
        <Text fontSize="sm" color={textColor}>
          {time}
        </Text>
      </Flex>
    </Box>
  );
};

export default Footer;
