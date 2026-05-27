import { Box } from "@chakra-ui/react";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import ParticleBackground from "./components/ParticleBackground";
import OllamaChat from "./components/OllamaChat";
import EasterEggs from "./components/EasterEggs";
import CursorSpotlight from "./components/CursorSpotlight";
import MatrixRain from "./components/MatrixRain";
import {
  ShortcutsModal,
  GNavigator,
  CommandPalette,
} from "./components/Shortcuts";
import HomePage from "./pages/HomePage";
import UsesPage from "./pages/UsesPage";
import NowPage from "./pages/NowPage";
import ColophonPage from "./pages/ColophonPage";
import ConsolePage from "./pages/ConsolePage";
import GuestbookPage from "./pages/GuestbookPage";
import ResumePage from "./pages/ResumePage";
import PlayPage from "./pages/PlayPage";
import NotFoundPage from "./pages/NotFoundPage";
import data from "./data/me";

function App() {
  useEffect(() => {
    document.title = data.name;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", data.desc_brief);
  }, []);

  return (
    <BrowserRouter>
      <ParticleBackground />

      <Box position="relative" zIndex={1}>
        <NavBar data={data} />

        <Routes>
          <Route path="/" element={<HomePage data={data} />} />
          <Route path="/uses" element={<UsesPage data={data} />} />
          <Route path="/now" element={<NowPage data={data} />} />
          <Route path="/colophon" element={<ColophonPage />} />
          <Route path="/console" element={<ConsolePage data={data} />} />
          <Route path="/guestbook" element={<GuestbookPage />} />
          <Route path="/resume" element={<ResumePage data={data} />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <Footer name={data.name} resumeUrl={data.resumeUrl} />
      </Box>

      <OllamaChat data={data} />
      <EasterEggs />
      <CursorSpotlight />
      <MatrixRain />
      <ShortcutsModal />
      <GNavigator />
      <CommandPalette contacts={data.contacts} />
    </BrowserRouter>
  );
}

export default App;
