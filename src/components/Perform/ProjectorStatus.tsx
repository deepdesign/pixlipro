import { Button } from "@/components/Button";
import { Monitor, Wifi, WifiOff } from "lucide-react";
import { useDualMonitor } from "@/hooks/useDualMonitor";

export function ProjectorStatus() {
  const dualMonitor = useDualMonitor();
  const isConnected = dualMonitor.isProjectorMode;

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Status indicator */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isConnected ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-gray-500" />
        )}
        <span className="text-sm text-theme-subtle">
          {isConnected ? "Projector Connected" : "Projector Disconnected"}
        </span>
      </div>

      {/* Projector button */}
      <div className="flex items-center gap-2">
        {isConnected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={dualMonitor.closeProjectorWindow}
          >
            <Monitor className="h-4 w-4 mr-2" />
            Close Projector
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={dualMonitor.openProjectorWindow}
          >
            <Monitor className="h-4 w-4 mr-2" />
            Open Projector
          </Button>
        )}
      </div>
    </div>
  );
}

