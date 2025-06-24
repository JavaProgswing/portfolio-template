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
      100: "#f0f0f0",
      200: "#e0e0e0",
      300: "#cfcfcf",
      400: "#a0a0a0",
      500: "#898989",
      600: "#6c6c6c",
      700: "#202020",
      800: "#121212",
      900: "#111",
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
        bg: props.colorMode === "light" ? "gray.300" : "gray.900",
        color: props.colorMode === "light" ? "gray.800" : "gray.100",
      },
    }),
  },
  components: {
    Text: {
      baseStyle: (props: { colorMode: string }) => ({
        color: props.colorMode === "light" ? "gray.700" : "gray.300",
      }),
    },
  },
});

export default theme;
