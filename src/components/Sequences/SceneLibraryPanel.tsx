import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/Input";
import type { Scene } from "@/lib/storage/sceneStorage";
import type { GeneratorState } from "@/types/generator";
import { Plus, Upload, Search } from "lucide-react";

interface SceneLibraryPanelProps {
  scenes: Scene[];
  onAddScene: (scene: Scene | GeneratorState) => void;
}

export function SceneLibraryPanel({
  scenes,
  onAddScene,
}: SceneLibraryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredScenes = scenes.filter((scene) =>
    scene.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result as string;
          const sceneData = JSON.parse(json) as GeneratorState;
          // Validate it's a GeneratorState-like object
          if (sceneData && typeof sceneData === "object") {
            onAddScene(sceneData);
          } else {
            alert("Invalid scene JSON format");
          }
        } catch (error) {
          alert("Failed to parse JSON file");
        }
      };
      reader.readAsText(file);
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [onAddScene]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-theme-divider">
        <h2 className="text-lg font-semibold text-theme-heading mb-4">
          Scene library
        </h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-theme-subtle" />
          <Input
            type="text"
            placeholder="Search scenes..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUpload}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload JSON scene
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="flex-1 overflow-auto p-4">
        {filteredScenes.length === 0 ? (
          <div className="text-center py-8 text-theme-muted">
            {searchQuery ? "No scenes found" : "No scenes available"}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredScenes.map((scene) => (
              <div
                key={scene.id}
                className="flex items-center justify-between p-3 border border-theme-panel rounded-md hover:bg-theme-icon transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-theme-heading truncate">
                    {scene.name}
                  </div>
                  <div className="text-xs text-theme-subtle">
                    Linked scene
                  </div>
                </div>
                <Button
                  variant="naked"
                  size="icon"
                  onClick={() => onAddScene(scene)}
                  title="Add to sequence"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

