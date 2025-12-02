import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/catalyst/input";
import { Field, Label } from "@/components/catalyst/fieldset";
import { Play, Pause, Square, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/catalyst/badge";

interface ShowTimerProps {
  className?: string;
}

type TimerState = "stopped" | "running" | "paused";

export function ShowTimer({ className }: ShowTimerProps) {
  const [state, setState] = useState<TimerState>("stopped");
  const [duration, setDuration] = useState<number>(3600); // Default 1 hour in seconds
  const [remaining, setRemaining] = useState<number>(3600);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pausedTime, setPausedTime] = useState<number>(0);
  const [alarmTime] = useState<number | null>(null); // Reserved for future alarm feature
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state === "running" && startTime !== null) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000) - pausedTime;
        const newRemaining = Math.max(0, duration - elapsed);
        setRemaining(newRemaining);

        if (newRemaining === 0) {
          setState("stopped");
          // Trigger alarm if set
          if (alarmTime !== null && alarmTime <= 0) {
            // Alarm already triggered
          } else if (alarmTime !== null) {
            // Show notification
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Show Timer", {
                body: "Time's up!",
                icon: "/favicon.ico",
              });
            }
          }
        }
      }, 100);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [state, startTime, duration, pausedTime, alarmTime]);

  const handleStart = () => {
    if (state === "paused") {
      // Resume
      const newPausedTime = pausedTime + (Date.now() - (startTime || 0)) / 1000;
      setPausedTime(newPausedTime);
      setStartTime(Date.now());
      setState("running");
    } else {
      // Start fresh
      setStartTime(Date.now());
      setPausedTime(0);
      setRemaining(duration);
      setState("running");
    }
  };

  const handlePause = () => {
    setState("paused");
  };

  const handleStop = () => {
    setState("stopped");
    setStartTime(null);
    setPausedTime(0);
    setRemaining(duration);
  };

  const handleDurationChange = (value: string) => {
    const seconds = parseInt(value) || 0;
    setDuration(seconds);
    if (state === "stopped") {
      setRemaining(seconds);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRequestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    handleRequestNotificationPermission();
  }, []);

  return (
    <div className={`bg-theme-card rounded-lg border border-theme-panel shadow-sm p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-theme-muted" />
          <Label className="text-sm font-semibold text-theme-heading">
            Show Timer
          </Label>
        </div>
        {state === "running" && remaining <= 300 && remaining > 0 && (
          <Badge color="red" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {remaining <= 60 ? "Final Minute" : "5 Min Warning"}
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {/* Timer Display */}
        <div className="text-center">
          <div
            className={`text-4xl font-mono font-bold ${
              remaining <= 300 && state === "running"
                ? "text-red-600 dark:text-red-400"
                : "text-theme-heading"
            }`}
          >
            {formatTime(remaining)}
          </div>
          <p className="text-xs text-theme-muted mt-1">
            {state === "stopped" && "Ready"}
            {state === "running" && "Running"}
            {state === "paused" && "Paused"}
          </p>
        </div>

        {/* Duration Input (only when stopped) */}
        {state === "stopped" && (
          <Field>
            <Label htmlFor="timer-duration">Duration (seconds)</Label>
            <Input
              id="timer-duration"
              type="number"
              value={duration.toString()}
              onChange={(e) => handleDurationChange(e.target.value)}
              min={1}
              className="mt-1"
            />
            <p className="text-xs text-theme-muted mt-1">
              Current: {formatTime(duration)}
            </p>
          </Field>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          {state === "stopped" || state === "paused" ? (
            <Button onClick={handleStart} variant="default" size="sm">
              <Play className="h-4 w-4 mr-2" />
              {state === "paused" ? "Resume" : "Start"}
            </Button>
          ) : (
            <Button onClick={handlePause} variant="outline" size="sm">
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          {state !== "stopped" && (
            <Button onClick={handleStop} variant="outline" size="sm">
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          )}
        </div>

        {/* Quick Duration Buttons */}
        {state === "stopped" && (
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              onClick={() => {
                setDuration(900);
                setRemaining(900);
              }}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              15 min
            </Button>
            <Button
              onClick={() => {
                setDuration(1800);
                setRemaining(1800);
              }}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              30 min
            </Button>
            <Button
              onClick={() => {
                setDuration(3600);
                setRemaining(3600);
              }}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              1 hour
            </Button>
            <Button
              onClick={() => {
                setDuration(7200);
                setRemaining(7200);
              }}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              2 hours
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


