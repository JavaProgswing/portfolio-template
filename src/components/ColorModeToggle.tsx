import { Button, useColorMode } from "@chakra-ui/react";

const ColorModeToggle = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Button
      onClick={toggleColorMode}
      size="xs"
      variant="outline"
      borderColor="rgba(255,255,255,0.14)"
      color="gray.400"
      borderRadius="md"
      fontFamily="mono"
      fontSize="11px"
      fontWeight="500"
      px={2.5}
      h="22px"
      _hover={{
        color: "gray.100",
        borderColor: "rgba(255,255,255,0.3)",
        bg: "rgba(255,255,255,0.05)",
      }}
    >
      {colorMode === "light" ? "dark" : "light"}
    </Button>
  );
};

export default ColorModeToggle;
