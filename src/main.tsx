// SPDX-License-Identifier: MIT
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import theme from "./theme";
import data from "./data/me";

// DevTools welcome message for anyone who opens the console.
if (typeof window !== "undefined") {
  const firstName = data.name.split(" ")[0].toLowerCase();
  const github = data.contacts.find((c) => c.id === "github")?.link || "";
  // Extract the handle if this is a direct github.com URL.
  const ghMatch = github.match(/github\.com\/([^/?#]+)/);
  const ghUrl = ghMatch ? `https://github.com/${ghMatch[1]}` : github;

  console.log(
    `%c~/${firstName}`,
    "color:#818cf8;font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:700;letter-spacing:-0.02em;line-height:1.4;"
  );
  console.log(
    `%chey, you opened DevTools. nice.\n\n%c→ source: ${ghUrl}\n→ stack: react + chakra + framer + vite + fastapi\n→ ai chat: gemini via server proxy\n\n%ctry the konami code  ↑↑↓↓←→←→ba  🎮\nor type "matrix" / "rainbow" anywhere on the page`,
    "color:#a1a1aa;font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.7;",
    "color:#6b7280;font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.7;",
    "color:#818cf8;font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.7;font-style:italic;"
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <App />
    </ChakraProvider>
  </React.StrictMode>
);
