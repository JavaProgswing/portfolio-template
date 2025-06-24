import { IconButton, useColorMode } from "@chakra-ui/react";
import { FunctionComponent } from "react";
import { IconBaseProps } from "react-icons";
import { FaSun, FaMoon } from "react-icons/fa";

const ColorModeToggle = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  const FaMoonIcon = FaMoon as FunctionComponent<IconBaseProps>;
  const FaSunIcon = FaSun as FunctionComponent<IconBaseProps>;
  return (
    <IconButton
      aria-label="Toggle color mode"
      icon={colorMode === "light" ? <FaMoonIcon /> : <FaSunIcon />}
      onClick={toggleColorMode}
      variant="ghost"
      size="md"
    />
  );
};
export default ColorModeToggle;
