import { extendTheme, ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  fonts: {
    heading: "'Inter', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  colors: {
    gray: {
      50: "#f9f9f9",
      100: "#ededed",
      200: "#d3d3d3",
      300: "#b3b3b3",
      400: "#a0a0a0",
      500: "#898989",
      600: "#6c6c6c",
      700: "#202020",
      800: "#121212",
      900: "#0a0a0a",
    },
    brand: {
      50: "#e0f2ff",
      100: "#b9dbff",
      200: "#8cc5ff",
      300: "#5eaeff",
      400: "#3398ff",
      500: "#007fff",
      600: "#0066cc",
      700: "#004c99",
      800: "#003366",
      900: "#001933",
    },
    accent: {
      purple: "#805ad5",
      cyan: "#0bc5ea",
      green: "#38a169",
    },
  },
  styles: {
    global: (props: { colorMode: string }) => ({
      "@keyframes blink": {
        "0%": { opacity: 1 },
        "50%": { opacity: 0 },
        "100%": { opacity: 1 },
      },
      "@keyframes pulse-glow": {
        "0%, 100%": { opacity: 1, boxShadow: "0 0 6px rgba(72,187,120,0.8)" },
        "50%": { opacity: 0.5, boxShadow: "0 0 2px rgba(72,187,120,0.3)" },
      },
      "@keyframes live-dot": {
        "0%, 100%": { transform: "scale(1)", opacity: 1 },
        "50%": { transform: "scale(1.5)", opacity: 0.6 },
      },
      "@keyframes float": {
        "0%, 100%": { transform: "translateY(0px)" },
        "50%": { transform: "translateY(-6px)" },
      },
      body: {
        bg: props.colorMode === "light" ? "gray.50" : "gray.900",
        color: props.colorMode === "light" ? "gray.800" : "gray.100",
        backgroundImage:
          props.colorMode === "dark"
            ? "radial-gradient(ellipse at 50% 0%, #141428 0%, #0a0a0a 70%)"
            : "none",
        fontFamily: "'Inter', system-ui, sans-serif",
      },
    }),
  },
  layerStyles: {
    glass: {
      bg: "rgba(255, 255, 255, 0.04)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      boxShadow: "0 4px 30px rgba(0, 0, 0, 0.15)",
    },
    glassStrong: {
      bg: "rgba(255, 255, 255, 0.07)",
      backdropFilter: "blur(16px)",
      border: "1px solid rgba(255, 255, 255, 0.12)",
      boxShadow: "0 8px 40px rgba(0, 0, 0, 0.2)",
    },
    glow: {
      boxShadow: "0 0 15px rgba(66, 153, 225, 0.5)",
    },
  },
  components: {
    Text: {
      baseStyle: (props: { colorMode: string }) => ({
        color: props.colorMode === "light" ? "gray.700" : "gray.300",
      }),
    },
    Heading: {
      baseStyle: {
        fontFamily: "'Inter', system-ui, sans-serif",
        fontWeight: "700",
      },
    },
    Button: {
      baseStyle: {
        fontWeight: "600",
        fontFamily: "'Inter', system-ui, sans-serif",
      },
      variants: {
        glow: {
          bg: "transparent",
          border: "1px solid",
          borderColor: "brand.400",
          color: "brand.400",
          _hover: {
            boxShadow: "0 0 15px rgba(51, 152, 255, 0.6)",
            bg: "rgba(51, 152, 255, 0.1)",
          },
        },
        terminal: {
          bg: "transparent",
          border: "1px solid",
          borderColor: "green.500",
          color: "green.400",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "sm",
          _hover: {
            boxShadow: "0 0 12px rgba(72, 187, 120, 0.4)",
            bg: "rgba(72, 187, 120, 0.08)",
          },
        },
      },
    },
  },
});

export default theme;
