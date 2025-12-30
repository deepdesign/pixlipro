import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/Button";
import { HeadlessSelect } from "@/components/ui/Select";
import { Save } from "lucide-react";
import { CodeEditor } from "./CodeEditor";
import { SimpleControls } from "./SimpleControls";
import { AnimationThumbnail } from "./AnimationThumbnail";
import { ANIMATION_TEMPLATES, getTemplateById } from "./FunctionTemplates";
import { movementModeToCodeFunctions } from "@/lib/utils/movementModeToAnimation";
import type { CustomAnimation, DefaultAnimation, Animation } from "@/types/animations";

interface AnimationEditorProps {
  animation?: Animation; // If editing existing
  onSave: (animation: CustomAnimation) => void;
  onCancel: () => void;
}

interface EditorState {
  name: string;
  description?: string;
  codeFunctions: {
    path: string;
    scale?: string;
  };
  expressionMode: "math" | "javascript";
  duration: number;
  loop: boolean;
}

function getDefaultEditorState(): EditorState {
  // Use circular motion as default template
  const template = getTemplateById("circular") || ANIMATION_TEMPLATES[0];
  return {
    name: "",
    description: "",
    codeFunctions: { ...template.codeFunctions },
    expressionMode: "javascript",
    duration: 2.0,
    loop: true,
  };
}

export function AnimationEditor({ animation, onSave, onCancel }: AnimationEditorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [editorState, setEditorState] = useState<EditorState>(() => {
    if (animation) {
      if (animation.isDefault) {
        // Convert default animation to editor state
        const defaultAnim = animation as DefaultAnimation;
        const codeFunctions = movementModeToCodeFunctions(defaultAnim.movementMode);
        return {
          name: `${defaultAnim.name} custom`,
          description: `Custom version of ${defaultAnim.name}`,
          codeFunctions,
          expressionMode: "javascript",
          duration: 2.0,
          loop: true,
        };
      } else {
        // Load existing custom animation
        const customAnim = animation as CustomAnimation;
        return {
          name: customAnim.name,
          description: customAnim.description,
          codeFunctions: { ...customAnim.codeFunctions },
          expressionMode: customAnim.expressionMode,
          duration: customAnim.duration,
          loop: customAnim.loop,
        };
      }
    }
    return getDefaultEditorState();
  });

  // Debounced preview animation state - only updates after user stops typing
  const [debouncedCodeFunctions, setDebouncedCodeFunctions] = useState(editorState.codeFunctions);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce code function updates (500ms delay)
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedCodeFunctions(editorState.codeFunctions);
    }, 500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [editorState.codeFunctions?.path, editorState.codeFunctions?.scale]);

  // Create temporary CustomAnimation for preview (uses debounced code functions)
  // Use stable ID to prevent unnecessary remounts - only remount when code actually changes
  const previewAnimation = useMemo<CustomAnimation | null>(() => {
    if (!debouncedCodeFunctions?.path) {
      return null;
    }

    // Create a stable hash from code content (simple hash function)
    // This ensures the component only remounts when code actually changes
    const codeContent = `${debouncedCodeFunctions.path}${debouncedCodeFunctions.scale || ''}`;
    let hash = 0;
    for (let i = 0; i < codeContent.length; i++) {
      const char = codeContent.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const stableId = `preview-${Math.abs(hash).toString(36)}`;

    return {
      id: stableId, // Stable ID based on code content hash
      name: editorState.name || "Preview",
      description: editorState.description,
      isDefault: false,
      createdAt: 0, // Use 0 instead of Date.now() to keep it stable
      updatedAt: 0, // Use 0 instead of Date.now() to keep it stable
      codeFunctions: debouncedCodeFunctions,
      expressionMode: editorState.expressionMode,
      duration: editorState.duration,
      loop: editorState.loop,
    };
  }, [
    debouncedCodeFunctions?.path,
    debouncedCodeFunctions?.scale,
    editorState.name,
    editorState.description,
    editorState.expressionMode,
    editorState.duration,
    editorState.loop,
  ]);

  const handleSave = useCallback(() => {
    if (!editorState.name.trim()) {
      alert("Please enter an animation name");
      return;
    }

    if (!editorState.codeFunctions?.path) {
      alert("Please provide a path function");
      return;
    }

    const customAnim: CustomAnimation = {
      id: animation && !animation.isDefault ? (animation as CustomAnimation).id : "", // Will be generated by saveCustomAnimation
      name: editorState.name.trim(),
      description: editorState.description,
      isDefault: false,
      createdAt: animation && !animation.isDefault ? (animation as CustomAnimation).createdAt : Date.now(),
      updatedAt: Date.now(),
      codeFunctions: editorState.codeFunctions,
      expressionMode: editorState.expressionMode,
      duration: editorState.duration,
      loop: true, // All animations loop by default
    };

    onSave(customAnim);
  }, [editorState, animation, onSave]);

  const handleTemplateSelect = useCallback((templateId: string) => {
    const template = getTemplateById(templateId);
    if (template) {
      // Clear any pending debounce
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }

      const newCodeFunctions = { ...template.codeFunctions };
      
      // Update both states synchronously to prevent flashing
      // React 18+ automatically batches these updates
      setEditorState((prev) => ({
        ...prev,
        codeFunctions: newCodeFunctions,
      }));
      setDebouncedCodeFunctions(newCodeFunctions);
      
      // Keep the template selected (don't reset)
      setSelectedTemplateId(templateId);
    }
  }, []);

  const handlePasteCode = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      // Try to parse as JSON first (might be a full animation object)
      try {
        const parsed = JSON.parse(text);
        if (parsed.codeFunctions) {
          setEditorState((prev) => ({
            ...prev,
            codeFunctions: { ...parsed.codeFunctions },
            name: parsed.name || prev.name,
            description: parsed.description || prev.description,
            duration: parsed.duration || prev.duration,
            loop: parsed.loop !== undefined ? parsed.loop : prev.loop,
          }));
          return;
        }
      } catch {
        // Not JSON, treat as code
      }
      // If not JSON or no codeFunctions, treat as path code
      setEditorState((prev) => ({
        ...prev,
        codeFunctions: {
          ...prev.codeFunctions,
          path: text,
        },
      }));
    } catch (error) {
      console.error("Failed to paste code:", error);
      alert("Failed to paste code from clipboard");
    }
  }, []);

  const handleClearCode = useCallback(() => {
      setEditorState((prev) => ({
        ...prev,
        codeFunctions: {
          path: "",
          scale: undefined,
        },
      }));
  }, []);

  return (
    <div className="w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-theme-structural">
        <div className="flex-1">
          <input
            type="text"
            value={editorState.name}
            onChange={(e) => setEditorState((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Animation name"
            className="text-xl font-semibold bg-transparent border-0 text-theme-text focus:outline-none focus:ring-0 w-full placeholder:text-theme-subtle"
          />
          <input
            type="text"
            value={editorState.description || ""}
            onChange={(e) => setEditorState((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Description (optional)"
            className="text-sm text-theme-subtle bg-transparent border-0 focus:outline-none focus:ring-0 w-full mt-1 placeholder:text-theme-subtle"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="link"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleSave}
            className="bg-theme-primary text-theme-primary-contrast"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex gap-4 min-h-0">
          {/* Left: Preview */}
          <div className="w-80 flex-shrink-0 flex flex-col gap-4">
            <div className="flex-shrink-0">
              <h3 className="text-sm font-medium text-theme-text mb-2">Preview</h3>
              <div 
                className="w-full aspect-video bg-theme-panel rounded border border-theme-structural flex items-center justify-center overflow-hidden relative"
                data-animation-editor="true"
              >
                {previewAnimation ? (
                  <AnimationThumbnail 
                    key="editor-preview" // Stable key - never changes to prevent remounts
                    animation={previewAnimation} 
                    size={320} 
                  />
                ) : (
                  <div className="text-sm text-theme-subtle">No preview available</div>
                )}
              </div>
            </div>

            {/* Templates */}
            <div className="flex-shrink-0">
              <h3 className="text-sm font-medium text-theme-text mb-2">Templates</h3>
              <HeadlessSelect
                value={selectedTemplateId}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    handleTemplateSelect(value);
                  }
                }}
              >
                <option value="">Select a template...</option>
                {ANIMATION_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </HeadlessSelect>
            </div>

            {/* Simple Controls */}
            <div className="flex-1 overflow-y-auto">
              <SimpleControls
                duration={editorState.duration}
                onDurationChange={(value) => setEditorState((prev) => ({ ...prev, duration: value }))}
              />
            </div>
          </div>

          {/* Right: Code Editor */}
          <div className="flex-1 flex flex-col min-h-0">
            <CodeEditor
              pathCode={editorState.codeFunctions.path}
              scaleCode={editorState.codeFunctions.scale}
              onPathCodeChange={(code) =>
                setEditorState((prev) => ({
                  ...prev,
                  codeFunctions: { ...prev.codeFunctions, path: code },
                }))
              }
              onScaleCodeChange={(code) =>
                setEditorState((prev) => ({
                  ...prev,
                  codeFunctions: { ...prev.codeFunctions, scale: code },
                }))
              }
              onPasteCode={handlePasteCode}
              onClearCode={handleClearCode}
            />
          </div>
        </div>
    </div>
  );
}

