import Intro from "./components/Intro";
import NavBar from "./components/NavBar";
import Projects from "./components/Projects";
import data from "./data/me";

function App() {
  return (
    <>
      <NavBar data={data} />
      <Intro data={data} />
      <Projects data={data} />
    </>
  );
}

export default App;
