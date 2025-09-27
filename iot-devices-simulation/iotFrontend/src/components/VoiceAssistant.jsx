import { useEffect, useRef } from "react";

export default function VoiceAssistant({ devices, toggleDevice, setCategory }) {
  const recognitionRef = useRef(null);
  const spokenDevicesRef = useRef(new Set());
  const stopRequestedRef = useRef(true); // start as stopped

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  // Announce anomalies
  useEffect(() => {
    const interval = setInterval(() => {
      devices.forEach((device) => {
        if (device.alert && !spokenDevicesRef.current.has(device.device_id)) {
          spokenDevicesRef.current.add(device.device_id);
          speak(`⚠️ Alert! ${device.device_id} has exceeded safe limits.`);
        }
        if (!device.alert && spokenDevicesRef.current.has(device.device_id)) {
          spokenDevicesRef.current.delete(device.device_id);
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [devices]);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) return;

    if (!recognitionRef.current) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onstart = () => speak("Listening for your command");

      recognitionRef.current.onresult = (event) => {
        const command =
          event.results[event.results.length - 1][0].transcript.toLowerCase();
        console.log("Voice Command:", command);

        // --- Turn On/Off Device ---
        const turnOffMatch = command.match(/turn off device (\d+)/);
        const turnOnMatch = command.match(/turn on device (\d+)/);

        if (turnOffMatch) {
          const deviceId = `device_${turnOffMatch[1]}`;
          toggleDevice(deviceId, "off");
          speak(`Device number ${turnOffMatch[1]} turned off.`);
        } else if (turnOnMatch) {
          const deviceId = `device_${turnOnMatch[1]}`;
          toggleDevice(deviceId, "on");
          speak(`Device number ${turnOnMatch[1]} turned on.`);
        }

        // --- Query Commands ---
        else if (command.includes("how many devices")) {
          let response = "";
          if (command.includes("in alert")) {
            const count = devices.filter(d => d.alert).length;
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

        // --- Display/Filter Commands ---
        else if (command.includes("display") || command.includes("show")) {
          const categories = ["pipe", "container", "battery bank", "all"];
          const foundCategory = categories.find(cat => command.includes(cat));
          if (foundCategory) {
            setCategory(foundCategory === "all" ? "all" : foundCategory.replace(" ", "_"));
            speak(`Displaying ${foundCategory} devices.`);
          } else {
            speak("Specify category: pipe, container, or battery bank.");
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
        // restart only if not requested to stop
        if (!stopRequestedRef.current) recognitionRef.current.start();
      };

      // Expose global controls
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

  return null;
}
