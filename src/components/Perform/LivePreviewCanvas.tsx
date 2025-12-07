import { useEffect, useRef } from "react";

interface LivePreviewCanvasProps {
  currentState?: any | null;
  isPlaying: boolean;
}

export function LivePreviewCanvas({ isPlaying }: LivePreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // TODO: Initialize canvas controller for preview
    // This will sync with the main canvas or projector output
    // For now, just show a placeholder
  }, []);

  return (
    <div ref={containerRef} className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block" }}
      />
      {/* Connection Status Overlay */}
      <div className="absolute top-2 right-2 flex items-center gap-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
        <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-green-500" : "bg-gray-500"}`} />
        <span>{isPlaying ? "Playing" : "Stopped"}</span>
      </div>
      {/* FPS Counter Overlay */}
      <div className="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
        FPS: 60
      </div>
    </div>
  );
}

