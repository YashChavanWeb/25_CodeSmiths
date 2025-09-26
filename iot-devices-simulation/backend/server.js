import WebSocket, { WebSocketServer } from "ws";

// Create WebSocket server
const wss = new WebSocketServer({ port: 8081 });

wss.on("connection", (ws) => {
  console.log("Dashboard connected to WebSocket server");

  ws.on("message", (message) => {
    console.log("Received:", message.toString());
  });
});

export function broadcast(message) {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

console.log("WebSocket server running on ws://localhost:8080");
