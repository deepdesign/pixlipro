import { useEffect, useRef, useState } from "react";

/**
 * Projector Page - Canvas-only view for secondary display
 * This page displays the exact same canvas as the main UI by receiving
 * streamed frames, ensuring pixel-perfect synchronization without re-rendering
 */
export function ProjectorPage() {
  const videoRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(56.25); // Default to 16:9

  // Listen for canvas frames from main window via BroadcastChannel
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") {
      console.warn("BroadcastChannel not available");
      return;
    }

    const channel = new BroadcastChannel("pixli-projector-sync");

    channel.onmessage = (event) => {
      if (event.data.type === "canvas-frame" && videoRef.current) {
        // Display the streamed canvas frame
        videoRef.current.src = event.data.imageData;
        
        // Update aspect ratio if provided
        if (event.data.aspectRatio !== undefined) {
          setAspectRatio(event.data.aspectRatio);
        }
        
        if (!isConnected) {
          setIsConnected(true);
        }
      }
    };

    // Request initial connection
    channel.postMessage({ type: "request-state" });
    setIsConnected(true);

    return () => {
      channel.close();
    };
  }, [isConnected]);

  return (
    <div 
      ref={containerRef}
      className="h-screen w-screen bg-black overflow-hidden flex items-center justify-center"
      style={{
        position: "relative",
      }}
    >
      <div
        className="w-full relative"
        style={{
          paddingTop: `${aspectRatio}%`,
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      >
        <img
          ref={videoRef}
          alt="Projector Canvas"
          className="absolute inset-0 w-full h-full object-contain"
          style={{
            display: isConnected ? "block" : "none",
            objectFit: "contain",
          }}
        />
      </div>
      {!isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">Connecting to Canvas...</div>
            <div className="text-sm text-gray-400">Waiting for main window</div>
          </div>
        </div>
      )}
    </div>
  );
}

