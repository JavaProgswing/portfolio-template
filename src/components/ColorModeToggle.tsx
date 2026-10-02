import { Button, useColorMode } from "@chakra-ui/react";

const ColorModeToggle = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Button
      onClick={toggleColorMode}
      size="xs"
      variant="outline"
      borderColor="rgba(255,255,255,0.14)"
      color="fg.muted"
      borderRadius="md"
      fontFamily="mono"
      fontSize="11px"
      fontWeight="500"
      px={2.5}
      h="22px"
      _hover={{
        color: "fg.strong",
        borderColor: "rgba(255,255,255,0.3)",
        bg: "rgba(255,255,255,0.05)",
      }}
    >
      {colorMode === "light" ? "dark" : "light"}
    </Button>
  );
};

export default ColorModeToggle;
