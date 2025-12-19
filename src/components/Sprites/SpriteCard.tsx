import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/Button";
import { Pencil, Trash2 } from "lucide-react";
import type { CustomSprite } from "@/lib/storage/customSpriteStorage";

interface SpriteCardProps {
  sprite: CustomSprite;
  onRename: (spriteId: string, newName: string) => void;
  onDelete: (spriteId: string) => void;
  onMove: (spriteId: string) => void;
  availableCollections: Array<{ id: string; name: string }>;
  onMoveToCollection: (spriteId: string, collectionId: string) => void;
}

export function SpriteCard({
  sprite,
  onRename,
  onDelete,
  onMove: _onMove,
  availableCollections: _availableCollections,
  onMoveToCollection: _onMoveToCollection,
}: SpriteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(sprite.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Create blob URL for SVG preview with theme colors
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window === 'undefined') return 'dark';
    return document.documentElement.getAttribute('data-theme') || 'dark';
  });

  // Listen for theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(currentTheme);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Get the sprite preview color based on current theme
    // Light mode: darkest tint of primary theme color (900/textPrimary)
    // Dark mode: lightest primary theme color (050/tint50)
    const getSpriteColor = () => {
      if (typeof window === 'undefined') {
        return theme === 'light' ? '#0f172a' : '#f8fafc'; // Fallback colors
      }
      
      // Get theme colors dynamically from CSS variables
      const root = document.documentElement;
      if (theme === 'light') {
        // Light mode: use textPrimary (slate-900) or darkest tint
        const textPrimary = getComputedStyle(root).getPropertyValue('--theme-primary-textPrimary').trim();
        return textPrimary || '#0f172a'; // Fallback to slate-900
      } else {
        // Dark mode: use tint50 (lightest primary theme color)
        const tint50 = getComputedStyle(root).getPropertyValue('--theme-primary-tint50').trim();
        return tint50 || '#f8fafc'; // Fallback to slate-50
      }
    };

    const spriteColor = getSpriteColor();

    // Process SVG to remove background and apply theme colors
    let processedSvg = sprite.svgContent;
    
    // Remove background rectangles (common in SVG sprites)
    // Remove rects that are likely backgrounds (full width/height or large fills)
    processedSvg = processedSvg.replace(/<rect[^>]*fill\s*=\s*["']#[fF]{6}["'][^>]*\/?>/gi, ''); // Remove white backgrounds
    processedSvg = processedSvg.replace(/<rect[^>]*fill\s*=\s*["']#000000["'][^>]*\/?>/gi, ''); // Remove black backgrounds
    processedSvg = processedSvg.replace(/<rect[^>]*fill\s*=\s*["']none["'][^>]*\/?>/gi, ''); // Remove transparent rects
    
    // Replace fill colors in attributes (fill="color")
    processedSvg = processedSvg.replace(/fill\s*=\s*["']([^"']+)["']/gi, (match, color) => {
      const lowerColor = color.toLowerCase();
      // Keep "none" and "transparent" as-is
      if (lowerColor === 'none' || lowerColor === 'transparent') {
        return match;
      }
      // Replace all other colors with the theme color
      return `fill="${spriteColor}"`;
    });
    
    // Replace stroke colors in attributes (stroke="color")
    processedSvg = processedSvg.replace(/stroke\s*=\s*["']([^"']+)["']/gi, (match, color) => {
      const lowerColor = color.toLowerCase();
      if (lowerColor === 'none' || lowerColor === 'transparent') {
        return match;
      }
      return `stroke="${spriteColor}"`;
    });
    
    // Replace fill colors in style attributes (style="fill: color")
    processedSvg = processedSvg.replace(/style\s*=\s*["']([^"']*)["']/gi, (_match: string, styleContent: string) => {
      // Replace fill: color in styles, but preserve fill: none
      let newStyle = styleContent.replace(/fill\s*:\s*([^;]+)/gi, (_fillMatch: string, fillValue: string) => {
        const trimmedFill = fillValue.trim().toLowerCase();
        if (trimmedFill === 'none' || trimmedFill === 'transparent') {
          return _fillMatch;
        }
        return `fill: ${spriteColor}`;
      });
      // Replace stroke: color in styles, but preserve stroke: none
      newStyle = newStyle.replace(/stroke\s*:\s*([^;]+)/gi, (_strokeMatch: string, strokeValue: string) => {
        const trimmedStroke = strokeValue.trim().toLowerCase();
        if (trimmedStroke === 'none' || trimmedStroke === 'transparent') {
          return _strokeMatch;
        }
        return `stroke: ${spriteColor}`;
      });
      return `style="${newStyle}"`;
    });
    
    // Ensure the root SVG element has the theme color as the default fill
    // Elements without explicit fill will inherit this color
    const svgMatch = processedSvg.match(/<svg([^>]*)>/i);
    if (svgMatch) {
      const svgAttrs = svgMatch[1];
      // If root SVG doesn't have a fill attribute, add it so elements inherit the theme color
      if (!svgAttrs.includes('fill=')) {
        processedSvg = processedSvg.replace(/<svg([^>]*)>/i, `<svg$1 fill="${spriteColor}">`);
      }
    }
    
    const blob = new Blob([processedSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [sprite.svgContent, theme]);


  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveEdit = () => {
    if (editName.trim() && editName.trim() !== sprite.name) {
      onRename(sprite.id, editName.trim());
    } else {
      setEditName(sprite.name);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(sprite.name);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm(`Delete "${sprite.name}"?`)) {
      onDelete(sprite.id);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <div className="group relative bg-theme-card rounded-lg border border-theme-card p-2 hover:shadow-md transition-shadow overflow-visible">
      {/* SVG Preview */}
      <div className="w-full aspect-square rounded mb-2 flex items-center justify-center overflow-hidden relative">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={sprite.name}
            className="w-full h-full object-contain sprite-preview"
          />
        ) : (
          <div className="text-theme-subtle text-xs">Loading...</div>
        )}
        
        {/* Action buttons overlay - shown on hover */}
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={handleEdit}
            className="bg-theme-panel/90 backdrop-blur-sm hover:bg-theme-panel shadow-md"
            title="Rename sprite"
            aria-label="Rename sprite"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={handleDelete}
            className="bg-theme-panel/90 backdrop-blur-sm hover:bg-status-error shadow-md text-status-error"
            title="Delete sprite"
            aria-label="Delete sprite"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sprite Name */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSaveEdit();
            } else if (e.key === 'Escape') {
              handleCancelEdit();
            }
          }}
          className="w-full px-2 py-1 text-sm border border-theme-panel rounded bg-theme-select text-theme-primary"
        />
      ) : (
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleEdit}
            className="flex-1 text-left text-sm font-medium text-theme-primary hover:text-theme-muted truncate"
            title="Click to rename"
          >
            {sprite.name}
          </button>
        </div>
      )}
    </div>
  );
}

