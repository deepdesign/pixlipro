import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/Button";
import { Palette } from "lucide-react";

interface BackgroundColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const PRESET_COLORS = [
  "#000000", // Black
  "#FFFFFF", // White
  "#1E293B", // Slate 800
  "#0F172A", // Slate 900
  "#475569", // Slate 600
  "#334155", // Slate 700
];

export function BackgroundColorPicker({
  color,
  onChange,
}: BackgroundColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <div
          className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600"
          style={{ backgroundColor: color }}
        />
        <Palette className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg p-3 z-50 min-w-[200px]">
          <div className="mb-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Preset colours
            </label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  onClick={() => {
                    onChange(presetColor);
                    setIsOpen(false);
                  }}
                  className={`w-8 h-8 rounded border-2 transition-all ${
                    color === presetColor
                      ? "border-slate-900 dark:border-slate-100 scale-110"
                      : "border-slate-300 dark:border-slate-600 hover:scale-105"
                  }`}
                  style={{ backgroundColor: presetColor }}
                  title={presetColor}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Custom colour
            </label>
            <input
              type="color"
              value={color}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-10 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}

