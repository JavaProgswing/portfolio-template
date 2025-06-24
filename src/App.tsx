import Intro from "./components/Intro";
import NavBar from "./components/NavBar";
import data from "./data/me";

function App() {
  return (
    <>
      <NavBar data={data} />
      <Intro data={data} />
    </>
  );
}

export default App;
