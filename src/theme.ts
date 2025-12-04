import { extendTheme, ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false, // optional
};

const theme = extendTheme({
  config,
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
      900: "#0a0a0a", // Deep black
    },
    brand: {
      50: "#e0f2ff",
      100: "#b9dbff",
      200: "#8cc5ff",
      300: "#5eaeff",
      400: "#3398ff",
      500: "#007fff", // Primary Blue
      600: "#0066cc",
      700: "#004c99",
      800: "#003366",
      900: "#001933",
    },
    accent: {
      purple: "#805ad5",
      cyan: "#0bc5ea",
    },
  },
  styles: {
    global: (props: { colorMode: string }) => ({
      "@keyframes blink": {
        "0%": { opacity: 1 },
        "50%": { opacity: 0 },
        "100%": { opacity: 1 },
      },
      body: {
        bg: props.colorMode === "light" ? "gray.50" : "gray.900",
        color: props.colorMode === "light" ? "gray.800" : "gray.100",
        backgroundImage:
          props.colorMode === "dark"
            ? "radial-gradient(circle at 50% 0%, #1a1a1a 0%, #0a0a0a 100%)"
            : "none",
      },
    }),
  },
  layerStyles: {
    glass: {
      bg: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
    },
    glow: {
      boxShadow: "0 0 15px rgba(66, 153, 225, 0.5)", // Blue glow
    },
  },
  components: {
    Text: {
      baseStyle: (props: { colorMode: string }) => ({
        color: props.colorMode === "light" ? "gray.700" : "gray.300",
      }),
    },
    Button: {
      baseStyle: {
        fontWeight: "bold",
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
      },
    },
  },
});

export default theme;
