import { useState } from "react";
import { Button } from "@/components/Button";
import { ButtonGroup } from "@/components/ui/ButtonGroup";
import { validateCodeFunction } from "@/lib/utils/codeSandbox";

interface CodeEditorProps {
  pathCode: string;
  scaleCode?: string;
  onPathCodeChange: (code: string) => void;
  onScaleCodeChange?: (code: string) => void;
  onPasteCode?: () => void;
  onClearCode?: () => void;
}

export function CodeEditor({
  pathCode,
  scaleCode,
  onPathCodeChange,
  onScaleCodeChange,
  onPasteCode,
  onClearCode,
}: CodeEditorProps) {
  const [activeTab, setActiveTab] = useState<"path" | "scale">("path");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateCode = (code: string, type: string) => {
    if (!code.trim()) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[type];
        return next;
      });
      return;
    }

    const validation = validateCodeFunction(code);
    if (!validation.valid) {
      setErrors((prev) => ({ ...prev, [type]: validation.error || "Invalid syntax" }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[type];
        return next;
      });
    }
  };

  const handlePathChange = (value: string) => {
    onPathCodeChange(value);
    validateCode(value, "path");
  };

  const handleScaleChange = (value: string) => {
    onScaleCodeChange?.(value);
    validateCode(value, "scale");
  };

  const currentCode = activeTab === "path" ? pathCode : scaleCode;
  const currentError = errors[activeTab];

  return (
    <div className="flex flex-col h-full bg-theme-panel rounded-lg border border-theme-structural">
      {/* Tabs */}
      <div className="p-2 border-b border-theme-structural">
        <ButtonGroup
          value={activeTab}
          onChange={(value) => setActiveTab(value as "path" | "scale")}
          options={[
            { value: "path", label: "Path Function" },
            { value: "scale", label: "Scale Function" },
          ]}
        />
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 relative">
          <textarea
            value={currentCode || ""}
            onChange={(e) => {
              if (activeTab === "path") handlePathChange(e.target.value);
              else handleScaleChange(e.target.value);
            }}
            placeholder={
              activeTab === "path"
                ? "function path(t, phase) {\n  return { x: 0, y: 0 };\n}"
                : "function scale(t) {\n  return 1;\n}"
            }
            className="w-full h-full p-4 font-mono text-sm bg-theme-bg-base border-0 rounded-b-lg text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-primary resize-none"
            spellCheck={false}
          />
          {currentError && (
            <div className="absolute bottom-2 left-2 right-2 p-2 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-xs">
              {currentError}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-2 border-t border-theme-structural bg-theme-bg-base">
          <div className="text-xs text-theme-subtle">
            {activeTab === "path" && "Returns { x, y } position"}
            {activeTab === "scale" && "Returns scale multiplier (0-2)"}
          </div>
          <div className="flex gap-2">
            {onPasteCode && (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={onPasteCode}
                className="text-xs"
              >
                Paste Code
              </Button>
            )}
            {onClearCode && (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={onClearCode}
                className="text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

