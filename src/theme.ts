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
    // Zinc neutrals (shadcn/ui dark palette)
    gray: {
      50:  "#fafafa",
      100: "#f4f4f5",
      200: "#e4e4e7",
      300: "#d4d4d8",
      400: "#a1a1aa",
      500: "#71717a",
      600: "#52525b",
      700: "#3f3f46",
      800: "#27272a",
      900: "#18181b",
      950: "#09090b",
    },
    // Indigo accent, more distinctive than a generic blue
    brand: {
      50:  "#eef2ff",
      100: "#e0e7ff",
      200: "#c7d2fe",
      300: "#a5b4fc",
      400: "#818cf8",
      500: "#6366f1",
      600: "#4f46e5",
      700: "#4338ca",
      800: "#3730a3",
      900: "#312e81",
    },
  },
  styles: {
    global: (props: { colorMode: string }) => ({
      "@keyframes blink": {
        "0%":   { opacity: 1 },
        "50%":  { opacity: 0 },
        "100%": { opacity: 1 },
      },
      "@keyframes live-dot": {
        "0%, 100%": { transform: "scale(1)", opacity: 1 },
        "50%":       { transform: "scale(1.6)", opacity: 0.5 },
      },
      "@keyframes float": {
        "0%, 100%": { transform: "translateY(0px)" },
        "50%":       { transform: "translateY(-5px)" },
      },
      "html, body": {
        fontSize: "15px",
        fontFamily: "'Inter', system-ui, sans-serif",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      },
      body: {
        bg:    props.colorMode === "dark" ? "#09090b" : "#fafafa",
        color: props.colorMode === "dark" ? "#e4e4e7" : "#18181b",
        lineHeight: "1.6",
        // Long unbreakable strings (URLs, mono code) shouldn't force horizontal
        // scroll on narrow phones. Safe: this doesn't create a scroll container.
        overflowWrap: "break-word",
      },
      // Typography defaults
      "h1, h2, h3, h4, h5, h6": {
        letterSpacing: "-0.025em",
      },
    }),
  },
  layerStyles: {
    // Surfaces read from CSS vars so they can flip for light mode
    // (see index.css: body defaults + body[data-mode="light"] overrides).
    card: {
      bg: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "12px",
    },
    glass: {
      bg: "var(--surface)",
      backdropFilter: "blur(12px)",
      border: "1px solid var(--border)",
    },
    glassStrong: {
      bg: "var(--surface-strong)",
      backdropFilter: "blur(16px)",
      border: "1px solid var(--border-strong)",
    },
  },
  components: {
    Heading: {
      baseStyle: {
        fontFamily: "'Inter', system-ui, sans-serif",
        fontWeight: "700",
        letterSpacing: "-0.025em",
      },
    },
    Text: {
      baseStyle: (props: { colorMode: string }) => ({
        color: props.colorMode === "dark" ? "gray.300" : "gray.700",
      }),
    },
    Button: {
      baseStyle: {
        fontWeight: "500",
        fontFamily: "'Inter', system-ui, sans-serif",
      },
      variants: {
        glow: {
          bg: "transparent",
          border: "1px solid",
          borderColor: "brand.400",
          color: "brand.400",
          _hover: {
            boxShadow: "0 0 12px rgba(99,102,241,0.4)",
            bg: "rgba(99,102,241,0.08)",
          },
        },
      },
    },
    Tabs: {
      variants: {
        line: {
          tab: {
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "13px",
            color: "gray.500",
            _selected: { color: "brand.400", borderColor: "brand.400" },
            _hover: { color: "gray.200" },
          },
        },
      },
    },
    Badge: {
      baseStyle: {
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: "500",
        fontSize: "11px",
      },
    },
    Tag: {
      baseStyle: {
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "11px",
      },
    },
    Link: {
      baseStyle: {
        _hover: { textDecoration: "none" },
      },
    },
  },
});

export default theme;
