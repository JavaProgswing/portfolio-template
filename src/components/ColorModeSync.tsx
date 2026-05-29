// SPDX-License-Identifier: MIT
import { useEffect } from "react";
import { useColorMode } from "@chakra-ui/react";
import { resolveInitialTheme, isMinimalTheme } from "../themes/palettes";

/**
 * Coordinates Chakra colorMode with the active palette.
 *
 * Light mode is only meaningful on the minimal themes; immersive and
 * pop-culture themes are dark-only. This component forces those back to
 * dark and mirrors the resolved mode onto body[data-mode], which drives
 * the surface CSS vars and per-theme light overrides in index.css.
 *
 * Renders nothing.
 */
const ColorModeSync = () => {
  const { colorMode, setColorMode } = useColorMode();

  useEffect(() => {
    let theme = resolveInitialTheme();

    const sync = () => {
      const minimal = isMinimalTheme(theme);
      // Immersive themes are dark-only: snap back if left in light.
      if (!minimal && colorMode === "light") {
        setColorMode("dark");
        return; // re-runs once colorMode settles to dark
      }
      document.body.dataset.mode =
        minimal && colorMode === "light" ? "light" : "dark";
    };

    sync();

    const onThemeChange = (e: Event) => {
      theme = (e as CustomEvent<string>).detail;
      sync();
    };
    window.addEventListener("themechange", onThemeChange);
    return () => window.removeEventListener("themechange", onThemeChange);
  }, [colorMode, setColorMode]);

  return null;
};

export default ColorModeSync;
