import React, { useState } from "react";
import { Button } from "@/components/Button";
import "@/components/Button.css";
import { Save, Download, Trash2, Edit, Plus, X, Check, Play, Pause, Square, SkipBack, SkipForward, Upload, Copy } from "lucide-react";

interface ButtonExample {
  id: string;
  variant: "default" | "secondary" | "outline" | "link" | "circle";
  size: "sm" | "md" | "lg" | "icon";
  label: string;
  icon?: React.ReactNode;
  className?: string;
  stylingSystem: "Tailwind" | "Custom CSS" | "Mixed";
  hasHover: boolean;
  hoverState: string;
  baseClasses: string;
  variantClasses: string;
  sizeClasses: string;
  inUse: boolean;
  notes?: string;
}

export function ButtonTestPage() {


  // Generate all button combinations
  const generateButtonExamples = (): ButtonExample[] => {
    const variants: Array<ButtonExample["variant"]> = ["default", "secondary", "outline", "link", "circle"];
    const sizes: Array<ButtonExample["size"]> = ["sm", "md", "lg", "icon"];
    
    // Define which combinations are in use (based on grep results)
    const inUseMap: Record<string, boolean> = {
      "primary-sm": true,    // ShowTimer (was default-sm)
      "primary-md": true,    // SceneNameConflictDialog, ExportModal, FullscreenHUD, AnimationPage (was default-md)
      "primary-lg": false,   // was default-lg
      "primary-icon": true,  // PlaybackControls, RowPlayer (was default-icon)
      "secondary-sm": true,   // ProjectorStatus
      "secondary-md": true,   // SequenceManager, CustomPaletteManager, CustomPalettesTab, FullscreenHUD
      "secondary-lg": false,
      "outline-sm": true,     // PlaybackControls, EditQueuePanel, ShowTimer, Sequences/PlaybackControls
      "outline-md": true,     // Many places
      "outline-lg": false,
      "outline-icon": true,   // SequenceManager, many places
      "link-sm": false,
      "link-md": true,        // SceneManager, CustomPaletteManager, CustomPalettesTab, SequenceManager (was naked-md)
      "link-lg": false,
      "link-icon": true,      // Header, SequenceManager, Sequences, ScenesTab, CollectionSidebar (was naked-icon)
      "link-icon-destructive": true, // SpriteControls, ControlSelect (replaces lock-icon)
      "secondary-icon": true, // StatusBar, ColourControls, App, many places
      "circle-sm": false,
      "circle-md": true,       // CustomPalettesTab
      "circle-lg": false,
      "circle-icon": false,
    };

    const examples: ButtonExample[] = [];

    variants.forEach((variant) => {
      sizes.forEach((size) => {
        // Skip circle variant with sizes other than md (circle doesn't use size classes)
        if (variant === "circle" && size !== "md") {
          return;
        }
        
        // Skip outline-icon - handled as special case with forced border
        if (variant === "outline" && size === "icon") {
          return;
        }

        // Use "primary" in ID instead of "default" for display purposes
        const displayVariant = variant === "default" ? "primary" : variant;
        const key = `${displayVariant}-${size}`;
        const inUse = inUseMap[key] || false;
        const isIcon = size === "icon";
        
        // Get appropriate label and icon
        let label = "";
        let icon: React.ReactNode | undefined;
        
        if (variant === "circle") {
          // Circle buttons only contain icons, default to X
          icon = <X className="h-4 w-4" />;
          label = ""; // Circle buttons should never have labels
        } else if (isIcon) {
          icon = <Save className="h-4 w-4" />;
        } else {
          label = `${variant.charAt(0).toUpperCase() + variant.slice(1)} ${size.toUpperCase()}`;
        }

        // Determine styling system
        // All buttons now use custom CSS (Button.css) as the base
        // All buttons are "Custom CSS" - no more Mixed/Tailwind
        let stylingSystem: "Tailwind" | "Custom CSS" | "Mixed" = "Custom CSS";

        // Get base classes
        const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

        // Get variant classes
        let variantClasses = "";
        if (variant === "default") {
          variantClasses = isIcon
            ? "bg-[var(--accent-primary)] text-[var(--accent-primary-contrast)] hover:bg-[var(--accent-primary)]/90 border-0"
            : "bg-[var(--accent-primary)] text-[var(--accent-primary-contrast)] hover:bg-[var(--accent-primary)]/90";
        } else if (variant === "secondary") {
          variantClasses = "bg-theme-icon text-theme-primary hover:bg-[var(--icon-hover)]";
        } else if (variant === "outline") {
          variantClasses = "border border-[var(--select-border)] bg-transparent text-theme-primary hover:bg-[var(--select-hover)] hover:border-[var(--select-hover)]";
        } else if (variant === "link") {
          variantClasses = "bg-transparent text-theme-muted hover:bg-[var(--icon-hover)] border-0";
        } else if (variant === "circle") {
          variantClasses = "bg-theme-icon text-theme-muted hover:bg-[var(--icon-hover)] border-0 rounded-full icon-button h-6 w-6 p-0 flex items-center justify-center aspect-square";
        }

        // Get size classes
        let sizeClasses = "";
        if (variant === "circle") {
          sizeClasses = "(no size classes - fixed dimensions)";
        } else if (size === "sm") {
          sizeClasses = "h-8 px-3 text-xs";
        } else if (size === "md") {
          sizeClasses = "h-9 px-4 text-sm";
        } else if (size === "lg") {
          sizeClasses = "h-11 px-8 text-base";
        } else if (size === "icon") {
          sizeClasses = "h-9 w-9 p-0 icon-button";
        }

        // Get hover state description
        let hoverState = "";
        if (variant === "default") {
          hoverState = "bg-[var(--accent-primary)]/90";
        } else if (variant === "secondary") {
          hoverState = "bg-[var(--icon-hover)]";
        } else if (variant === "outline") {
          hoverState = "bg-[var(--select-hover)] border-[var(--select-hover)]";
        } else if (variant === "link" || variant === "circle") {
          hoverState = "bg-[var(--icon-hover)]";
        }

        // Skip secondary-icon and link-icon as they're handled as special cases
        if (key === "secondary-icon" || key === "link-icon") {
          return;
        }

        examples.push({
          id: key,
          variant,
          size,
          label,
          icon,
          stylingSystem,
          hasHover: true,
          hoverState,
          baseClasses,
          variantClasses,
          sizeClasses,
          inUse,
          notes: inUse ? `Used in app` : `Not currently used`,
        });
      });
    });

    // Add special cases
    examples.push(
      {
        id: "secondary-icon",
        variant: "secondary",
        size: "icon",
        label: "",
        icon: <Edit className="h-4 w-4" />,
        className: "",
        stylingSystem: "Custom CSS",
        hasHover: true,
        hoverState: "bg-[var(--icon-hover)]",
        baseClasses: "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        variantClasses: "bg-theme-icon text-theme-primary hover:bg-[var(--icon-hover)] border-0",
        sizeClasses: "h-9 w-9 p-0 icon-button",
        inUse: true,
        notes: "Standard secondary icon button - used in StatusBar, ColourControls, App, many places",
      },
      {
        id: "outline-icon",
        variant: "outline",
        size: "icon",
        label: "",
        icon: <Edit className="h-4 w-4" />,
        className: "",
        stylingSystem: "Custom CSS",
        hasHover: true,
        hoverState: "bg-[var(--select-hover)] border-[var(--select-hover)]",
        baseClasses: "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        variantClasses: "border border-[var(--select-border)] bg-transparent text-theme-primary hover:bg-[var(--select-hover)] hover:border-[var(--select-hover)]",
        sizeClasses: "h-9 w-9 p-0 icon-button",
        inUse: true,
        notes: "Standard outline icon button with forced border",
      },
      {
        id: "outline-icon-destructive",
        variant: "outline",
        size: "icon",
        label: "",
        icon: <Trash2 className="h-4 w-4" />,
        className: "btn-error",
        stylingSystem: "Custom CSS",
        hasHover: true,
        hoverState: "bg-[var(--status-error)] text-white",
        baseClasses: "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        variantClasses: "border border-[var(--select-border)] bg-transparent text-theme-primary hover:bg-[var(--select-hover)] hover:border-[var(--select-hover)]",
        sizeClasses: "h-9 w-9 p-0 icon-button",
        inUse: true,
        notes: "Custom error styling with !important overrides (SceneManager delete button)",
      },
      {
        id: "secondary-icon-destructive",
        variant: "secondary",
        size: "icon",
        label: "",
        icon: <Trash2 className="h-4 w-4" />,
        className: "btn-error",
        stylingSystem: "Custom CSS",
        hasHover: true,
        hoverState: "bg-[var(--status-error)] text-white",
        baseClasses: "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        variantClasses: "bg-theme-icon text-theme-primary hover:bg-[var(--icon-hover)] border-0",
        sizeClasses: "h-9 w-9 p-0 icon-button",
        inUse: false,
        notes: "Secondary button with error/destructive styling (red text, red hover)",
      },
      {
        id: "link-icon",
        variant: "link",
        size: "icon",
        label: "",
        icon: <Save className="h-4 w-4" />,
        className: "",
        stylingSystem: "Custom CSS",
        hasHover: true,
        hoverState: "bg-[var(--icon-hover)]",
        baseClasses: "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        variantClasses: "bg-transparent text-theme-muted hover:bg-[var(--icon-hover)] border-0",
        sizeClasses: "h-9 w-9 p-0 icon-button",
        inUse: true,
        notes: "Replaces naked-icon in app - used in Header, SequenceManager, Sequences, ScenesTab, CollectionSidebar",
      },
      {
        id: "link-icon-destructive",
        variant: "link",
        size: "icon",
        label: "",
        icon: <Trash2 className="h-4 w-4" />,
        className: "btn-error",
        stylingSystem: "Custom CSS",
        hasHover: true,
        hoverState: "bg-[var(--status-error)] text-white",
        baseClasses: "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        variantClasses: "bg-transparent text-theme-muted hover:bg-[var(--icon-hover)] border-0",
        sizeClasses: "h-9 w-9 p-0 icon-button",
        inUse: true,
        notes: "Used for lock buttons in SpriteControls and ControlSelect. Default: red text, hover/selected: red bg with white text. Supports data-locked attribute for locked state.",
      },
    );

    return examples;
  };

  const buttonExamples = generateButtonExamples();

  return (
    <div className="h-screen w-full bg-theme-bg-base overflow-y-scroll">
      <div className="w-full p-8 space-y-8">
        <div className="bg-theme-panel rounded-lg border border-theme-card p-6">
          <h2 className="text-xl font-semibold text-theme-primary mb-4">Button Variants Overview</h2>
          <p className="text-sm text-theme-muted mb-6">
            This page displays all button variants, sizes, and their styling information for visual audit. Includes all combinations, even if not currently used in the app.
          </p>

          <div className="overflow-x-auto w-full">
            <style>{`
              /* Force hover state on buttons in hover column - apply hover styles directly */
              .force-hover-state {
                pointer-events: none !important;
              }
              
              /* Apply hover styles directly (matching Button.css :hover rules) */
              .force-hover-state.btn-default,
              .force-hover-state.btn-default.btn-icon {
                background-color: color-mix(in srgb, var(--accent-primary) 90%, transparent) !important;
                color: var(--accent-primary-contrast) !important;
              }
              
              .force-hover-state.btn-secondary:not(.btn-icon) {
                background-color: var(--icon-hover) !important;
                color: var(--theme-primary) !important;
              }
              
              .force-hover-state.btn-secondary.btn-icon {
                background-color: var(--theme-primary-iconHoverNormal) !important;
                color: var(--theme-primary) !important;
                box-shadow: none !important;
              }
              
              .force-hover-state.btn-outline:not(.btn-error) {
                background-color: var(--select-hover) !important;
                border-color: var(--select-hover) !important;
                color: var(--theme-primary) !important;
              }
              
              .force-hover-state.btn-link:not(.btn-error) {
                text-decoration: underline !important;
                color: var(--theme-primary) !important;
              }
              
              .force-hover-state.btn-link:not(.btn-icon) {
                background-color: var(--icon-hover) !important;
                color: var(--theme-muted) !important;
              }
              
              .force-hover-state.btn-link.btn-icon {
                background-color: var(--theme-primary-iconHover) !important;
                color: var(--theme-muted) !important;
                box-shadow: none !important;
              }
              
              .force-hover-state.btn-circle:not(.btn-icon) {
                background-color: var(--icon-hover) !important;
                color: var(--theme-muted) !important;
              }
              
              .force-hover-state.btn-circle.btn-icon {
                background-color: var(--theme-primary-iconHover) !important;
                color: var(--theme-muted) !important;
                box-shadow: none !important;
              }
              
              /* Error button hover states */
              .force-hover-state.btn-outline.btn-error,
              .force-hover-state.btn-secondary.btn-error,
              .force-hover-state.btn-link.btn-error {
                background-color: var(--status-error) !important;
                border-color: var(--status-error) !important;
                color: #FFF !important;
              }
              
              /* Error button icons - outlined (stroke only) for icon buttons */
              .force-hover-state.btn-outline.btn-error.btn-icon svg,
              .force-hover-state.btn-secondary.btn-error.btn-icon svg,
              .force-hover-state.btn-link.btn-error.btn-icon svg,
              .force-hover-state.btn-outline.btn-error.btn-icon svg *,
              .force-hover-state.btn-secondary.btn-error.btn-icon svg *,
              .force-hover-state.btn-link.btn-error.btn-icon svg * {
                color: #FFF !important;
                fill: none !important;
                stroke: #FFF !important;
                stroke-width: 2 !important;
              }
              
              /* Selected states */
              button[data-locked="true"].lock-selected,
              .lock-selected[data-locked="true"] {
                background-color: var(--status-error) !important;
                color: white !important;
              }
              
              button[data-locked="true"].lock-selected svg,
              .lock-selected[data-locked="true"] svg {
                color: white !important;
              }
              
              .outline-icon-destructive-selected svg,
              .outline-icon-destructive-selected svg *,
              .link-icon-destructive-selected svg,
              .link-icon-destructive-selected svg * {
                fill: none !important;
                stroke: #FFF !important;
                stroke-width: 2 !important;
              }
            `}</style>
            <table className="w-full border-collapse min-w-full">
              <thead>
                <tr className="border-b border-theme-card">
                  <th className="text-left p-3 text-sm font-semibold text-theme-primary">ID</th>
                  <th className="text-left p-3 text-sm font-semibold text-theme-primary">Variant</th>
                  <th className="text-left p-3 text-sm font-semibold text-theme-primary">Size</th>
                  <th className="text-center p-3 text-sm font-semibold text-theme-primary">In Use</th>
                  <th className="text-center p-3 text-sm font-semibold text-theme-primary">Default</th>
                  <th className="text-center p-3 text-sm font-semibold text-theme-primary">Hover</th>
                  <th className="text-center p-3 text-sm font-semibold text-theme-primary">Active</th>
                  <th className="text-center p-3 text-sm font-semibold text-theme-primary">Selected</th>
                  <th className="text-center p-3 text-sm font-semibold text-theme-primary">Disabled</th>
                  <th className="text-left p-3 text-sm font-semibold text-theme-primary">Styling System</th>
                  <th className="text-left p-3 text-sm font-semibold text-theme-primary">Notes</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Group buttons by variant
                  const grouped = buttonExamples.reduce((acc, example) => {
                    const groupKey = example.variant;
                    if (!acc[groupKey]) {
                      acc[groupKey] = [];
                    }
                    acc[groupKey].push(example);
                    return acc;
                  }, {} as Record<string, ButtonExample[]>);

                  // Define variant order
                  const variantOrder: Array<ButtonExample["variant"]> = [
                    "default",
                    "secondary",
                    "outline",
                    "link",
                    "circle",
                  ];

                  // Render grouped rows
                  return variantOrder.map((variant) => {
                    const examples = grouped[variant] || [];
                    if (examples.length === 0) return null;

                    return (
                      <React.Fragment key={variant}>
                        {/* Group Header */}
                        <tr className="bg-theme-icon/30 border-b-2 border-theme-card">
                          <td colSpan={11} className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-theme-primary uppercase tracking-wide">
                                {variant === "default" ? "primary" : variant}
                              </span>
                              <span className="text-xs text-theme-muted">
                                ({examples.length} {examples.length === 1 ? "example" : "examples"})
                              </span>
                            </div>
                          </td>
                        </tr>
                        {/* Group Rows */}
                        {examples.map((example) => {
                          const canBeSelected = example.variant === "default" || example.variant === "outline" || example.variant === "secondary" || example.id === "link-icon-destructive";
                          const isErrorButton = example.id === "outline-icon-destructive" || example.id === "link-icon-destructive";
                          
                          return (
                            <tr key={example.id} className="border-b border-theme-card hover:bg-theme-icon/50">
                              <td className="p-3 text-xs font-mono text-theme-muted">{example.id}</td>
                              <td className="p-3 text-sm text-theme-primary">{example.variant === "default" ? "primary" : example.variant}</td>
                              <td className="p-3 text-sm text-theme-primary">{example.size}</td>
                              
                              {/* In Use Column */}
                              <td className="p-3">
                                <div className="flex justify-center">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    example.inUse 
                                      ? "bg-green-500/20 text-green-400" 
                                      : "bg-gray-500/20 text-gray-400"
                                  }`}>
                                    {example.inUse ? "Yes" : "No"}
                                  </span>
                                </div>
                              </td>
                              
                              {/* Default State */}
                              <td className="p-3">
                                <div className="flex justify-center">
                                  <Button
                                    variant={example.variant}
                                    size={example.size}
                                    className={example.className}
                                  >
                                    {example.icon || example.label}
                                  </Button>
                                </div>
                              </td>
                              
                              {/* Hover State - static visual representation */}
                              <td className="p-3">
                                <div className="flex justify-center">
                                  <Button
                                    variant={example.variant}
                                    size={example.size}
                                    className={`${example.className || ""} btn-static btn-hover${isErrorButton ? " btn-error" : ""}${example.id === "secondary-icon-destructive" || example.id === "link-icon-destructive" ? " btn-error" : ""}`}
                                    style={{ pointerEvents: 'none' }}
                                    onMouseDown={(e) => e.preventDefault()}
                                  >
                                    {example.icon || example.label}
                                  </Button>
                                </div>
                              </td>
                              
                              {/* Active State - static visual representation */}
                              <td className="p-3">
                                <div className="flex justify-center">
                                  <Button
                                    variant={example.variant}
                                    size={example.size}
                                    className={`${example.className || ""} btn-static btn-active${isErrorButton ? " btn-error" : ""}${example.id === "secondary-icon-destructive" || example.id === "link-icon-destructive" ? " btn-error" : ""}`}
                                    style={{ pointerEvents: 'none' }}
                                    onMouseDown={(e) => e.preventDefault()}
                                  >
                                    {example.icon || example.label}
                                  </Button>
                                </div>
                              </td>
                              
                              {/* Selected State - static visual representation */}
                              <td className="p-3">
                                <div className="flex justify-center">
                                  {canBeSelected ? (
                                    (() => {
                                      if (isErrorButton) {
                                        // outline-icon-destructive and link-destructive stay red when selected
                                        return (
                                          <Button
                                            variant={example.id === "link-icon-destructive" ? "link" : "outline"}
                                            size={example.size}
                                            className={`btn-error btn-selected ${example.className || ""}`}
                                            style={{ pointerEvents: 'none' }}
                                            onMouseDown={(e) => e.preventDefault()}
                                          >
                                            {example.icon || example.label}
                                          </Button>
                                        );
                                      } else if (example.id === "secondary-icon-destructive") {
                                        // secondary-icon-destructive uses red when selected
                                        return (
                                          <Button
                                            variant="secondary"
                                            size={example.size}
                                            className="btn-error btn-selected"
                                            style={{ pointerEvents: 'none' }}
                                            onMouseDown={(e) => e.preventDefault()}
                                          >
                                            {example.icon || example.label}
                                          </Button>
                                        );
                                      } else {
                                        // All other variants use btn-selected class
                                        return (
                                          <Button
                                            variant={example.variant}
                                            size={example.size}
                                            className={`btn-selected ${example.className || ""}`}
                                            style={{ pointerEvents: 'none' }}
                                            onMouseDown={(e) => e.preventDefault()}
                                          >
                                            {example.icon || example.label}
                                          </Button>
                                        );
                                      }
                                    })()
                                  ) : (
                                    <span className="text-xs text-theme-muted">N/A</span>
                                  )}
                                </div>
                              </td>
                              
                              {/* Disabled State - static visual representation */}
                              <td className="p-3">
                                <div className="flex justify-center">
                                  <Button
                                    variant={example.variant}
                                    size={example.size}
                                    className={`${example.className || ""} btn-static${isErrorButton ? " btn-error" : ""}${example.id === "secondary-icon-destructive" || example.id === "link-icon-destructive" ? " btn-error" : ""}`}
                                    disabled
                                    style={{ pointerEvents: 'none' }}
                                    onMouseDown={(e) => e.preventDefault()}
                                  >
                                    {example.icon || example.label}
                                  </Button>
                                </div>
                              </td>
                              
                              <td className="p-3 text-sm text-theme-primary">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  example.stylingSystem === "Tailwind" 
                                    ? "bg-green-500/20 text-green-400" 
                                    : example.stylingSystem === "Custom CSS"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-yellow-500/20 text-yellow-400"
                                }`}>
                                  {example.stylingSystem}
                                </span>
                              </td>
                              <td className="p-3 text-xs text-theme-subtle">{example.notes || "-"}</td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Interactive Examples */}
        <div className="bg-theme-panel rounded-lg border border-theme-card p-6">
          <h2 className="text-xl font-semibold text-theme-primary mb-4">Interactive Examples</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-theme-primary mb-2">Disabled States</h3>
              <div className="flex gap-4 flex-wrap">
                <Button variant="default" disabled>Disabled Default</Button>
                <Button variant="secondary" disabled>Disabled Secondary</Button>
                <Button variant="outline" disabled>Disabled Outline</Button>
                <Button variant="secondary" size="icon" disabled>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* CSS Overrides Info */}
        <div className="bg-theme-panel rounded-lg border border-theme-card p-6">
          <h2 className="text-xl font-semibold text-theme-primary mb-4">CSS Overrides & Notes</h2>
          <div className="space-y-3 text-sm text-theme-muted">
            <div>
              <strong className="text-theme-primary">Icon Button CSS Overrides:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li><code className="text-xs bg-theme-bg-base px-1 py-0.5 rounded">.icon-button:hover</code> - Overrides hover for all icon buttons (slate-800)</li>
                <li><code className="text-xs bg-theme-bg-base px-1 py-0.5 rounded">.icon-button.bg-theme-icon:hover</code> - Overrides for buttons with background (slate-700)</li>
                <li><code className="text-xs bg-theme-bg-base px-1 py-0.5 rounded">.icon-button:hover:not([class*="border-"])</code> - Excludes outline buttons from override</li>
              </ul>
            </div>
            <div>
              <strong className="text-theme-primary">Styling Systems:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li><span className="text-green-400">Tailwind</span> - Pure Tailwind classes, no CSS overrides</li>
                <li><span className="text-blue-400">Custom CSS</span> - Uses custom CSS rules in index.css</li>
                <li><span className="text-yellow-400">Mixed</span> - Combination of Tailwind and custom CSS</li>
              </ul>
            </div>
            <div>
              <strong className="text-theme-primary">In Use Column:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li><span className="text-green-400">Yes</span> - This variant/size combination is currently used in the app</li>
                <li><span className="text-gray-400">No</span> - This combination is not currently used (shown with reduced opacity)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
