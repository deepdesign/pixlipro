import { useState, useEffect, useRef } from "react";
import { Field, Label } from "@/components/ui/fieldset";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, CheckCircle } from "lucide-react";

interface PerformanceTabProps {
  frameRate: number;
  ready: boolean;
}

export function PerformanceTab({ frameRate, ready }: PerformanceTabProps) {
  const [frameTime, setFrameTime] = useState<number>(0);
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null);
  const [gpuInfo, setGpuInfo] = useState<string | null>(null);
  const frameTimeHistoryRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(performance.now());

  // Calculate frame time
  useEffect(() => {
    if (!ready) return;

    const updateFrameTime = () => {
      const now = performance.now();
      const delta = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;

      frameTimeHistoryRef.current.push(delta);
      if (frameTimeHistoryRef.current.length > 60) {
        frameTimeHistoryRef.current.shift();
      }

      const avgFrameTime =
        frameTimeHistoryRef.current.reduce((a, b) => a + b, 0) /
        frameTimeHistoryRef.current.length;
      setFrameTime(avgFrameTime);
    };

    const interval = setInterval(updateFrameTime, 100);
    return () => clearInterval(interval);
  }, [ready]);

  // Get memory usage (if available)
  useEffect(() => {
    if (!ready) return;

    const updateMemory = () => {
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1048576;
        setMemoryUsage(usedMB);
      }
    };

    const interval = setInterval(updateMemory, 1000);
    updateMemory(); // Initial call
    return () => clearInterval(interval);
  }, [ready]);

  // Get GPU info (if available)
  useEffect(() => {
    if (!ready) return;

    const getGPUInfo = async () => {
      try {
        const adapter = await (navigator as any).gpu?.requestAdapter();
        if (adapter) {
          await adapter.requestDevice();
          setGpuInfo(adapter.info?.description || "WebGPU Available");
        }
      } catch (error) {
        // WebGPU not available or failed
        setGpuInfo(null);
      }
    };

    getGPUInfo();
  }, [ready]);

  const getPerformanceStatus = () => {
    if (frameRate >= 55) {
      return { status: "excellent", color: "green", icon: CheckCircle };
    } else if (frameRate >= 45) {
      return { status: "good", color: "blue", icon: Activity };
    } else if (frameRate >= 30) {
      return { status: "fair", color: "yellow", icon: Activity };
    } else {
      return { status: "poor", color: "red", icon: AlertTriangle };
    }
  };

  const perfStatus = getPerformanceStatus();
  const StatusIcon = perfStatus.icon;

  return (
    <div className="space-y-6 px-6">
      {/* Performance Overview Card */}
      <div className="bg-theme-panel rounded-lg border border-theme-card shadow-sm">
        <div className="p-6 border-b border-theme-card">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-theme-primary">
                Performance Overview
              </h3>
              <p className="text-sm text-theme-muted mt-1">
                Real-time performance metrics and system information
              </p>
            </div>
            <Badge
              color={perfStatus.color as any}
              className="flex items-center gap-1"
            >
              <StatusIcon className="h-3 w-3" />
              {perfStatus.status.toUpperCase()}
            </Badge>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* FPS */}
            <div className="p-4 bg-theme-icon rounded-lg">
              <span className="text-xs text-theme-subtle block">
                Frame Rate
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-theme-primary">
                  {frameRate.toFixed(1)}
                </span>
                <span className="text-sm text-theme-subtle">FPS</span>
              </div>
              <p className="text-xs text-theme-subtle mt-1">
                Target: 60 FPS
              </p>
            </div>

            {/* Frame Time */}
            <div className="p-4 bg-theme-icon rounded-lg">
              <span className="text-xs text-theme-subtle block">
                Frame Time
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-theme-primary">
                  {frameTime.toFixed(1)}
                </span>
                <span className="text-sm text-theme-subtle">ms</span>
              </div>
              <p className="text-xs text-theme-subtle mt-1">
                Target: &lt;16.67ms
              </p>
            </div>

            {/* Memory Usage */}
            <div className="p-4 bg-theme-icon rounded-lg">
              <span className="text-xs text-theme-subtle block">
                Memory Usage
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                {memoryUsage !== null ? (
                  <>
                    <span className="text-2xl font-semibold text-theme-primary">
                      {memoryUsage.toFixed(1)}
                    </span>
                    <span className="text-sm text-theme-subtle">MB</span>
                  </>
                ) : (
                  <span className="text-sm text-theme-subtle">
                    Not available
                  </span>
                )}
              </div>
              <p className="text-xs text-theme-subtle mt-1">
                JavaScript heap
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Information Card */}
      <div className="bg-theme-panel rounded-lg border border-theme-card shadow-sm">
        <div className="p-6 border-b border-theme-card">
          <h3 className="text-base font-semibold text-theme-primary">
            System Information
          </h3>
          <p className="text-sm text-theme-muted mt-1">
            Hardware and browser capabilities
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <Field>
              <Label>Browser</Label>
              <p className="text-sm text-theme-muted mt-1">
                {navigator.userAgent.split(" ")[0]} {navigator.userAgent.split(" ")[1]}
              </p>
            </Field>

            <Field>
              <Label>Hardware Concurrency</Label>
              <p className="text-sm text-theme-muted mt-1">
                {navigator.hardwareConcurrency || "Unknown"} CPU cores
              </p>
            </Field>

            {gpuInfo && (
              <Field>
                <Label>GPU</Label>
                <p className="text-sm text-theme-muted mt-1">{gpuInfo}</p>
              </Field>
            )}

            <Field>
              <Label>Screen Resolution</Label>
              <p className="text-sm text-theme-muted mt-1">
                {window.screen.width} × {window.screen.height}
              </p>
            </Field>

            <Field>
              <Label>Device Pixel Ratio</Label>
              <p className="text-sm text-theme-muted mt-1">
                {window.devicePixelRatio.toFixed(2)}x
              </p>
            </Field>
          </div>
        </div>
      </div>

      {/* Performance Tips Card */}
      <div className="bg-theme-panel rounded-lg border border-theme-card shadow-sm">
        <div className="p-6 border-b border-theme-card">
          <h3 className="text-base font-semibold text-theme-primary flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Performance Tips
          </h3>
        </div>
        <div className="p-6">
          <ul className="space-y-2 text-sm text-theme-muted">
            {frameRate < 30 && (
              <li className="flex items-start gap-2">
                <span className="text-status-error mt-0.5">•</span>
                <span>
                  <strong>Low FPS detected:</strong> Try reducing sprite density, disabling
                  complex effects, or closing other applications.
                </span>
              </li>
            )}
            {frameTime > 20 && (
              <li className="flex items-start gap-2">
                <span className="text-status-warning mt-0.5">•</span>
                <span>
                  <strong>High frame time:</strong> Consider reducing canvas resolution or
                  simplifying animations.
                </span>
              </li>
            )}
            {memoryUsage && memoryUsage > 500 && (
              <li className="flex items-start gap-2">
                <span className="text-status-warning mt-0.5">•</span>
                <span>
                  <strong>High memory usage:</strong> Close unused browser tabs or restart the
                  application.
                </span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="text-status-info mt-0.5">•</span>
              <span>
                Use hardware acceleration by enabling GPU rendering in your browser settings.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-status-info mt-0.5">•</span>
              <span>
                For best performance, use a modern browser with WebGL 2.0 support.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}


