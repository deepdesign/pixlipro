import QRCode from "qrcode";

/**
 * Generate QR code as data URL (for img src)
 */
export async function generateQRCodeDataURL(text: string): Promise<string> {
  try {
    const dataURL = await QRCode.toDataURL(text, {
      errorCorrectionLevel: "M",
      type: "image/png",
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return dataURL;
  } catch (error) {
    console.error("Failed to generate QR code:", error);
    throw error;
  }
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRCodeSVG(text: string): Promise<string> {
  try {
    const svg = await QRCode.toString(text, {
      type: "svg",
      errorCorrectionLevel: "M",
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return svg;
  } catch (error) {
    console.error("Failed to generate QR code SVG:", error);
    throw error;
  }
}

/**
 * Get local IP address (for WebSocket connection)
 * Note: This is a best-effort approach. In production, you'd want to
 * get this from the WebSocket server or use a service discovery mechanism.
 */
export function getLocalIP(): string {
  // Try to get IP from WebRTC (if available)
  return new Promise((resolve) => {
    const RTCPeerConnection =
      window.RTCPeerConnection ||
      (window as any).webkitRTCPeerConnection ||
      (window as any).mozRTCPeerConnection;

    if (!RTCPeerConnection) {
      // Fallback: use hostname or localhost
      resolve(window.location.hostname || "localhost");
      return;
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.createDataChannel("");
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate.candidate;
        const match = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);
        if (match) {
          const ip = match[1];
          // Filter out localhost and private IPs that aren't useful
          if (
            ip !== "127.0.0.1" &&
            !ip.startsWith("169.254") &&
            !ip.startsWith("0.0.0.0")
          ) {
            pc.close();
            resolve(ip);
            return;
          }
        }
      }
    };

    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch(() => {
        pc.close();
        resolve(window.location.hostname || "localhost");
      });

    // Timeout after 3 seconds
    setTimeout(() => {
      pc.close();
      resolve(window.location.hostname || "localhost");
    }, 3000);
  });
}

/**
 * Get WebSocket connection URL
 */
export async function getWebSocketURL(port: number = 8080): Promise<string> {
  const ip = await getLocalIP();
  return `ws://${ip}:${port}/pixli-remote`;
}

