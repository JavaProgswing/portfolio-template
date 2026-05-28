import { Box } from "@chakra-ui/react";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import ParticleBackground from "./components/ParticleBackground";
import AiChat from "./components/AiChat";
import EasterEggs from "./components/EasterEggs";
import AchievementToast from "./components/AchievementToast";
import ThemeFx from "./components/ThemeFx";
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
import SnakeGame from "./pages/games/SnakeGame";
import Game2048 from "./pages/games/Game2048";
import TypingGame from "./pages/games/TypingGame";
import WordleGame from "./pages/games/WordleGame";
import MinesweeperGame from "./pages/games/MinesweeperGame";
import LifeGame from "./pages/games/LifeGame";
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
          <Route path="/colophon" element={<ColophonPage data={data} />} />
          <Route path="/console" element={<ConsolePage data={data} />} />
          <Route path="/guestbook" element={<GuestbookPage planning={data.planning} />} />
          <Route path="/resume" element={<ResumePage data={data} />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/play/snake" element={<SnakeGame />} />
          <Route path="/play/2048" element={<Game2048 />} />
          <Route path="/play/typing" element={<TypingGame />} />
          <Route path="/play/wordle" element={<WordleGame />} />
          <Route path="/play/mines" element={<MinesweeperGame />} />
          <Route path="/play/life" element={<LifeGame />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <Footer name={data.name} resumeUrl={data.resumeUrl} />
      </Box>

      <AiChat data={data} />
      <EasterEggs />
      <AchievementToast />
      <ThemeFx />
      <CursorSpotlight />
      <MatrixRain />
      <ShortcutsModal />
      <GNavigator />
      <CommandPalette contacts={data.contacts} />
    </BrowserRouter>
  );
}

export default App;
