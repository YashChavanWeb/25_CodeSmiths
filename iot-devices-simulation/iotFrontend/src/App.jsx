import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Monitoring from "./pages/Monitoring";
import Simulation from "./pages/Simulation";
import Dashboard from "./pages/Dashboard";
import VoiceAssistant from "./components/VoiceAssistant";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/simulation" element={<Simulation/>} />
        <Route path="/" element={<Dashboard/>} />
        <Route path="/monitor" element={<Monitoring />} />
      </Routes>
    </Router>
  );
}
