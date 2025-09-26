import { useState } from "react";

export default function SmartAssistant({ devices, toggleDevice }) {
  const [listening, setListening] = useState(false);
  const [command, setCommand] = useState("");

  const handleVoice = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.start();

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setCommand(transcript);
      handleCommand(transcript);
    };
  };

  const handleCommand = (cmd) => {
    if (cmd.includes("turn off")) {
      const id = cmd.split("turn off ")[1];
      toggleDevice(id);
      speak(`Turning off device ${id}`);
    } else if (cmd.includes("turn on")) {
      const id = cmd.split("turn on ")[1];
      toggleDevice(id);
      speak(`Turning on device ${id}`);
    } else if (cmd.includes("how many devices")) {
      speak(`You are monitoring ${devices.length} devices`);
    } else if (cmd.includes("anomalies")) {
      const anomalies = devices.filter(d =>
        d.device_type === "container" &&
        (d.metrics.temperature_c > 80 || d.metrics.pressure_kpa > 120)
      );
      speak(`There are ${anomalies.length} anomalies detected`);
    } else {
      speak("Sorry, I did not understand the command.");
    }
  };

  const speak = (text) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    synth.speak(utterance);
  };

  return (
    <div className="p-4 bg-white border rounded-lg shadow mt-4">
      <h2 className="text-lg font-bold">Smart Assistant</h2>
      <p className="text-sm text-gray-600">Command: {command}</p>
      <button
        onClick={handleVoice}
        className="px-4 py-2 mt-2 bg-indigo-600 text-white rounded-lg"
      >
        {listening ? "Listening..." : "🎙️ Speak"}
      </button>
    </div>
  );
}
