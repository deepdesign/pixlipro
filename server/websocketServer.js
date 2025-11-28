/**
 * WebSocket Server for Pixli Mobile Remote Control
 * 
 * Run this server separately: node server/websocketServer.js
 * Or integrate into your main server
 */

import { WebSocketServer } from "ws";
import http from "http";

const PORT = process.env.PORT || 8080;

// Create HTTP server (can be integrated with Express/Vite preview server)
const server = http.createServer();
const wss = new WebSocketServer({ 
  server,
  path: "/pixli-remote"
});

// OSC WebSocket server (for OSC protocol bridge)
const oscWss = new WebSocketServer({ 
  server,
  path: "/osc"
});

// DMX WebSocket server (for DMX/Art-Net bridge)
const dmxWss = new WebSocketServer({ 
  server,
  path: "/dmx"
});

// Store connected clients
// Pixli app connections (control the app)
const pixliClients = new Map();
// Mobile client connections (remote control)
const mobileClients = new Map();

wss.on("connection", (ws, req) => {
  const clientId = `${req.socket.remoteAddress}-${Date.now()}`;
  let clientType = "unknown"; // Will be determined by first message
  let isPixliApp = false;
  
  console.log(`[WebSocket] Client connected: ${clientId}`);
  
  // Wait for first message to determine client type
  const firstMessageHandler = (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === "pixli-app-connect") {
        isPixliApp = true;
        clientType = "pixli-app";
        console.log(`[WebSocket] Identified as Pixli App: ${clientId}`);
        ws.off("message", firstMessageHandler);
        setupPixliAppClient(ws, clientId);
      } else {
        isPixliApp = false;
        clientType = "mobile";
        console.log(`[WebSocket] Identified as Mobile Client: ${clientId}`);
        ws.off("message", firstMessageHandler);
        setupMobileClient(ws, clientId, data);
      }
    } catch (error) {
      console.error(`[WebSocket] Error parsing first message:`, error);
      // Default to mobile client if parsing fails
      isPixliApp = false;
      clientType = "mobile";
      ws.off("message", firstMessageHandler);
      setupMobileClient(ws, clientId, {});
    }
  };
  
  ws.on("message", firstMessageHandler);
  
  // Timeout: if no message received in 2 seconds, assume mobile client
  setTimeout(() => {
    if (clientType === "unknown") {
      clientType = "mobile";
      isPixliApp = false;
      console.log(`[WebSocket] Timeout: Assuming Mobile Client: ${clientId}`);
      ws.off("message", firstMessageHandler);
      setupMobileClient(ws, clientId, {});
    }
  }, 2000);
});

function setupPixliAppClient(ws, clientId) {
  pixliClients.set(clientId, {
    ws,
    connectedAt: Date.now(),
  });
  
  // Notify mobile clients that Pixli app is connected
  broadcastToMobileClients({
    type: "pixli-connected",
    timestamp: Date.now(),
  });
  
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      handlePixliAppMessage(clientId, data);
    } catch (error) {
      console.error(`[WebSocket] Error parsing message from Pixli app:`, error);
    }
  });
  
  ws.on("close", () => {
    console.log(`[WebSocket] Pixli app disconnected: ${clientId}`);
    pixliClients.delete(clientId);
    if (pixliClients.size === 0) {
      broadcastToMobileClients({
        type: "pixli-disconnected",
        timestamp: Date.now(),
      });
    }
  });
  
  ws.on("error", (error) => {
    console.error(`[WebSocket] Error for Pixli app ${clientId}:`, error);
  });
}

function setupMobileClient(ws, clientId, firstMessage) {
  mobileClients.set(clientId, {
    ws,
    connectedAt: Date.now(),
  });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: "connected",
    clientId,
    pixliConnected: pixliClients.size > 0,
    timestamp: Date.now(),
  }));
  
  // Request initial state and presets from Pixli app
  if (pixliClients.size > 0) {
    broadcastToPixliClients({
      type: "request-state",
      fromClient: clientId,
    });
    
    broadcastToPixliClients({
      type: "request-presets",
      fromClient: clientId,
    });
  }
  
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      handleMobileClientMessage(clientId, data);
    } catch (error) {
      console.error(`[WebSocket] Error parsing message from mobile:`, error);
    }
  });
  
  ws.on("close", () => {
    console.log(`[WebSocket] Mobile client disconnected: ${clientId}`);
    mobileClients.delete(clientId);
    
    // Notify Pixli app of client count change
    broadcastToPixliClients({
      type: "client-disconnected",
      clients: mobileClients.size,
      timestamp: Date.now(),
    });
  });
  
  ws.on("error", (error) => {
    console.error(`[WebSocket] Error for mobile client ${clientId}:`, error);
  });
  
  // Notify Pixli app of new client
  broadcastToPixliClients({
    type: "client-connected",
    clients: mobileClients.size,
    timestamp: Date.now(),
  });
  
  // Handle first message if it was a command
  if (firstMessage && firstMessage.type && firstMessage.type !== "pixli-app-connect") {
    handleMobileClientMessage(clientId, firstMessage);
  }
}

// Handle messages from Pixli app
function handlePixliAppMessage(clientId, data) {
  switch (data.type) {
    case "state-update":
      // Broadcast state update to all mobile clients
      broadcastToMobileClients({
        type: "state-update",
        state: data.state,
        timestamp: data.timestamp || Date.now(),
      });
      break;

    case "preset-list":
      // Broadcast preset list to all mobile clients
      broadcastToMobileClients({
        type: "preset-list",
        presets: data.presets || [],
        timestamp: data.timestamp || Date.now(),
      });
      break;

    case "current-preset":
      // Broadcast current preset to all mobile clients
      broadcastToMobileClients({
        type: "current-preset",
        preset: data.preset,
        timestamp: data.timestamp || Date.now(),
      });
      break;

    case "client-connected":
    case "client-disconnected":
      // Update client count (already handled in setup functions)
      break;

    default:
      console.log(`[WebSocket] Unknown message type from Pixli app:`, data.type);
  }
}

// Handle messages from mobile clients
function handleMobileClientMessage(clientId, data) {
  switch (data.type) {
    case "request-presets":
      // Forward request to Pixli app
      broadcastToPixliClients({
        type: "request-presets",
        fromClient: clientId,
      });
      break;

    case "request-state":
      // Forward request to Pixli app
      broadcastToPixliClients({
        type: "request-state",
        fromClient: clientId,
      });
      break;

    case "load-preset":
      // Forward preset load request to Pixli app
      broadcastToPixliClients({
        type: "load-preset",
        presetId: data.presetId,
        fromClient: clientId,
      });
      break;

    case "randomize-all":
      // Forward randomize request to Pixli app
      broadcastToPixliClients({
        type: "randomize-all",
        fromClient: clientId,
      });
      break;

    default:
      console.log(`[WebSocket] Unknown message type from mobile:`, data.type);
  }
}

// Broadcast message to all Pixli app clients
function broadcastToPixliClients(message) {
  const json = JSON.stringify(message);
  pixliClients.forEach((client) => {
    if (client.ws.readyState === 1) { // WebSocket.OPEN
      client.ws.send(json);
    }
  });
}

// Broadcast message to all mobile clients
function broadcastToMobileClients(message) {
  const json = JSON.stringify(message);
  mobileClients.forEach((client) => {
    if (client.ws.readyState === 1) { // WebSocket.OPEN
      client.ws.send(json);
    }
  });
}

// OSC WebSocket connections
const oscClients = new Map();
oscWss.on("connection", (ws, req) => {
  const clientId = `${req.socket.remoteAddress}-${Date.now()}`;
  console.log(`[OSC] Client connected: ${clientId}`);
  
  oscClients.set(clientId, { ws, connectedAt: Date.now() });
  
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      // Handle OSC messages from client
      // In a real implementation, you would convert JSON to OSC format
      // and send via UDP to the OSC server
      console.log(`[OSC] Message from ${clientId}:`, data);
      
      // Broadcast to other OSC clients (if needed)
      oscClients.forEach((client, id) => {
        if (id !== clientId && client.ws.readyState === 1) {
          client.ws.send(JSON.stringify(data));
        }
      });
    } catch (error) {
      console.error(`[OSC] Error parsing message:`, error);
    }
  });
  
  ws.on("close", () => {
    console.log(`[OSC] Client disconnected: ${clientId}`);
    oscClients.delete(clientId);
  });
  
  ws.on("error", (error) => {
    console.error(`[OSC] Error for client ${clientId}:`, error);
  });
});

// DMX WebSocket connections
const dmxClients = new Map();
dmxWss.on("connection", (ws, req) => {
  const clientId = `${req.socket.remoteAddress}-${Date.now()}`;
  console.log(`[DMX] Client connected: ${clientId}`);
  
  dmxClients.set(clientId, { ws, connectedAt: Date.now() });
  
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === "config") {
        console.log(`[DMX] Config from ${clientId}:`, data);
        // Store DMX configuration
      } else if (data.type === "channel" || data.type === "channels") {
        // Handle DMX channel updates
        // In a real implementation, you would convert to Art-Net packets
        // and send via UDP to the Art-Net device
        console.log(`[DMX] Channel update from ${clientId}:`, data);
      } else if (data.type === "clear") {
        console.log(`[DMX] Clear channels from ${clientId}:`, data);
      }
    } catch (error) {
      console.error(`[DMX] Error parsing message:`, error);
    }
  });
  
  ws.on("close", () => {
    console.log(`[DMX] Client disconnected: ${clientId}`);
    dmxClients.delete(clientId);
  });
  
  ws.on("error", (error) => {
    console.error(`[DMX] Error for client ${clientId}:`, error);
  });
});

server.listen(PORT, () => {
  console.log(`[WebSocket Server] Listening on ws://localhost:${PORT}/pixli-remote`);
  console.log(`[OSC Server] Listening on ws://localhost:${PORT}/osc`);
  console.log(`[DMX Server] Listening on ws://localhost:${PORT}/dmx`);
  console.log(`[WebSocket Server] Ready for mobile remote connections`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[WebSocket Server] Shutting down...");
  wss.close(() => {
    server.close(() => {
      console.log("[WebSocket Server] Closed");
      process.exit(0);
    });
  });
});

export { wss, server };
