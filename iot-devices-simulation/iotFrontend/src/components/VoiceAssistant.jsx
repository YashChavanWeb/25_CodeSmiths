// src/components/VoiceAssistant.jsx
import { useEffect, useRef } from "react";

export default function VoiceAssistant({ devices, toggleDevice, setCategory }) {
  const recognitionRef = useRef(null);
  const stopRequestedRef = useRef(true); // Start as stopped

  // Function to speak the response
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) return;

    if (!recognitionRef.current) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onstart = () => speak("Listening for your command");

      recognitionRef.current.onresult = (event) => {
        const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
        console.log("Voice Command:", command);

        // --- Turn Off/On Device ---
        const turnOffMatch = command.match(/(turn|switch) off device (\d+)/);
        const turnOnMatch = command.match(/(turn|switch) on device (\d+)/);
        const turnBackOnMatch = command.match(/(turn|switch) back on device (\d+)/);

        if (turnOffMatch) {
          const deviceId = `device_${turnOffMatch[2]}`;
          toggleDevice(deviceId, "off");
          speak(`Device number ${turnOffMatch[2]} turned off.`);
        } else if (turnOnMatch) {
          const deviceId = `device_${turnOnMatch[2]}`;
          toggleDevice(deviceId, "on");
          speak(`Device number ${turnOnMatch[2]} turned on.`);
        } else if (turnBackOnMatch) {
          const deviceId = `device_${turnBackOnMatch[2]}`;
          const device = devices.find(d => d.device_id === deviceId);

          if (device && device.status === "off") {
            toggleDevice(deviceId, "on");
            speak(`Device number ${turnBackOnMatch[2]} turned back on.`);
          } else {
            speak(`Device number ${turnBackOnMatch[2]} is already on.`);
          }
        }

        // --- Failure Simulation ---
        else if (command.includes("simulate failure")) {
          speak("Simulating failure with provided parameters.");
        }

        // --- Query Commands ---
        else if (command.includes("how many devices")) {
          let response = "";
          if (command.includes("in alert")) {
            const count = devices.filter(d => d.status === "alert").length;
            response = `There are ${count} devices in alert.`;
          } else if (command.includes("present") || command.includes("total")) {
            response = `There are ${devices.length} devices present.`;
          } else {
            const categories = ["pipe", "container", "battery bank"];
            const foundCategory = categories.find(cat => command.includes(cat));
            if (foundCategory) {
              const count = devices.filter(d => d.device_type === foundCategory.replace(" ", "_")).length;
              response = `There are ${count} devices in category ${foundCategory}.`;
            } else {
              response = "Sorry, I could not understand the category you mentioned.";
            }
          }
          speak(response);
        }

        // --- Devices that are turned off ---
        else if (command.includes("which devices are turned off")) {
          const turnedOffDevices = devices
            .filter(d => !d.is_on)
            .map(d => d.device_id.replace("device_", "")) // Extract device ID
            .join(", "); // Join the device IDs with a comma

          if (turnedOffDevices) {
            speak(`The following devices are turned off: ${turnedOffDevices}`);
          } else {
            speak("All devices are currently on.");
          }
        }

        // --- Stop Voice Recognition ---
        else if (command.includes("stop voice")) {
          stopRequestedRef.current = true;
          recognitionRef.current.stop();
          speak("Voice recognition stopped.");
        }

        // --- Unknown Command ---
        else {
          speak("Command not recognized. You can turn on/off devices, ask counts, or filter by category.");
        }
      };

      recognitionRef.current.onerror = (e) => console.error("Speech recognition error:", e.error);

      recognitionRef.current.onend = () => {
        // Restart only if not requested to stop
        if (!stopRequestedRef.current) recognitionRef.current.start();
      };

      // Start listening globally
      window.startVoiceRecognition = () => {
        if (recognitionRef.current && stopRequestedRef.current) {
          stopRequestedRef.current = false;
          recognitionRef.current.start();
        }
      };
      window.stopVoiceRecognition = () => {
        stopRequestedRef.current = true;
        recognitionRef.current.stop();
      };
    }
  }, [devices, toggleDevice, setCategory]);

  return null; // This component doesn't render any UI; it's just for voice interaction
}
