import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Simulation from "./pages/Simulation";
import VoiceAssistant from "./components/VoiceAssistant";

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/simulation" element={<Simulation />} />
        </Routes>
      </Router>
    </>
  );
}
