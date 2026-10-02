// SPDX-License-Identifier: MIT
import { Box } from "@chakra-ui/react";
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import ParticleBackground from "./components/ParticleBackground";
import AiChat from "./components/AiChat";
import EasterEggs from "./components/EasterEggs";
import AchievementToast from "./components/AchievementToast";
import ThemeFx from "./components/ThemeFx";
import ScrollProgress from "./components/ScrollProgress";
import PageTransition from "./components/PageTransition";
import ColorModeSync from "./components/ColorModeSync";
import CursorSpotlight from "./components/CursorSpotlight";
import MatrixRain from "./components/MatrixRain";
import {
  ShortcutsModal,
  GNavigator,
  CommandPalette,
} from "./components/Shortcuts";
import HomePage from "./pages/HomePage";
import data from "./data/me";

// Everything except the home page is split into its own chunk and loaded on demand.
const NowPage = lazy(() => import("./pages/NowPage"));
const ColophonPage = lazy(() => import("./pages/ColophonPage"));
const ConsolePage = lazy(() => import("./pages/ConsolePage"));
const GuestbookPage = lazy(() => import("./pages/GuestbookPage"));
const ResumePage = lazy(() => import("./pages/ResumePage"));
const PlayPage = lazy(() => import("./pages/PlayPage"));
const SnakeGame = lazy(() => import("./pages/games/SnakeGame"));
const Game2048 = lazy(() => import("./pages/games/Game2048"));
const TypingGame = lazy(() => import("./pages/games/TypingGame"));
const WordleGame = lazy(() => import("./pages/games/WordleGame"));
const MinesweeperGame = lazy(() => import("./pages/games/MinesweeperGame"));
const LifeGame = lazy(() => import("./pages/games/LifeGame"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const LabPage = lazy(() => import("./pages/LabPage"));
const CertificatesPage = lazy(() => import("./pages/CertificatesPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <PageTransition>
      <Suspense fallback={<Box minH="100dvh" />}>
      <Routes location={location}>
          <Route path="/" element={<HomePage data={data} />} />
          <Route path="/blog" element={<BlogPage blogs={data.blogs || []} />} />
          <Route path="/blog/:slug" element={<BlogPostPage blogs={data.blogs || []} />} />
          <Route path="/lab" element={<LabPage data={data as any} />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/now" element={<NowPage data={data} />} />
          <Route path="/colophon" element={<ColophonPage data={data} />} />
          <Route path="/console" element={<ConsolePage data={data} />} />
          <Route path="/guestbook" element={<GuestbookPage />} />
          <Route path="/resume" element={<ResumePage data={data} />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/play/snake" element={<SnakeGame />} />
          <Route path="/play/2048" element={<Game2048 />} />
          <Route path="/play/typing" element={<TypingGame />} />
          <Route path="/play/wordle" element={<WordleGame />} />
          <Route path="/play/mines" element={<MinesweeperGame />} />
          <Route path="/play/life" element={<LifeGame />} />
          <Route path="*" element={<NotFoundPage blogs={data.blogs || []} />} />
      </Routes>
      </Suspense>
    </PageTransition>
  );
}

function App() {
  useEffect(() => {
    document.title = data.name;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", data.desc_brief);
  }, []);

  return (
    <BrowserRouter>
      <ScrollProgress />
      <ParticleBackground />

      <Box position="relative" zIndex={1}>
        <NavBar data={data} />

        <AnimatedRoutes />

        <Footer name={data.name} resumeUrl={data.resumeUrl} />
      </Box>

      <AiChat data={data} />
      <EasterEggs />
      <AchievementToast />
      <ThemeFx />
      <ColorModeSync />
      <CursorSpotlight />
      <MatrixRain />
      <ShortcutsModal />
      <GNavigator />
      <CommandPalette contacts={data.contacts} />
    </BrowserRouter>
  );
}

export default App;
