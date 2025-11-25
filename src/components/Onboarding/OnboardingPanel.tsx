import { useState, useEffect } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup } from "@/components/retroui/Select";
import { ChevronRight, ChevronLeft, Sparkles, Shapes, Palette, Zap, Camera, Bookmark, X, Info } from "lucide-react";
import { markWelcomeSeen, markTourCompleted } from "@/lib/storage/onboardingStorage";
import { PixliLogo } from "@/components/Header";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  heading?: string; // Optional heading for content area (different from tab title)
  contentDescription?: string; // Optional description for content area (different from tab description)
  content: (setFullSizeImage: (src: string) => void) => React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}

interface OnboardingPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome",
    description: "Get started with Pixli",
    heading: "Welcome to Pixli",
    contentDescription: "Discover how to capture beautiful moments from your dynamic canvas",
    icon: Sparkles,
    content: (setFullSizeImage: (src: string) => void) => (
      <div className="space-y-4">
        <p className="text-xs leading-relaxed text-[var(--text-muted)]">
          Pixli is all about capturing the moment—like photography, but with a dynamic canvas. 
          Your canvas is constantly moving and evolving, creating a composition that's never the same twice. 
          Time your shutter to capture the perfect moment, where shapes align, colours blend, and movement creates something beautiful. 
          It's a blend of skill and luck—wait for the right moment, or keep shooting until you capture something special.
        </p>
        <div className="space-y-3">
          <div>
            <strong className="text-xs">Wallpapers & backgrounds</strong>
            <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Create unique, animated wallpapers for your devices. Export in HD, 4K, or custom sizes to match your screen perfectly.</p>
          </div>
          <div>
            <strong className="text-xs">Social media content</strong>
            <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Generate eye-catching images for Instagram, Twitter, or Facebook. Use preset dimensions or create custom sizes for your posts and stories.</p>
          </div>
          <div>
            <strong className="text-xs">Digital art & prints</strong>
            <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Export high-resolution images suitable for printing. Create art prints, posters, or use in digital projects with professional quality outputs.</p>
          </div>
          <div>
            <strong className="text-xs">Experimentation & inspiration</strong>
            <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Explore endless combinations of shapes, colours, and motion. Save your favourites as presets and share them with others.</p>
          </div>
        </div>
        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-3">Examples</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <img
              src="/onboarding-images/examples/diamond-aurora-glass-pulse-897x897-2025-11-21-21-29.png"
              alt="Example 1"
              className="w-full h-auto rounded border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setFullSizeImage("/onboarding-images/examples/diamond-aurora-glass-pulse-897x897-2025-11-21-21-29.png")}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <img
              src="/onboarding-images/examples/hexagon-aurora-glass-isometric-897x897-2025-11-21-21-32.png"
              alt="Example 2"
              className="w-full h-auto rounded border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setFullSizeImage("/onboarding-images/examples/hexagon-aurora-glass-isometric-897x897-2025-11-21-21-32.png")}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <img
              src="/onboarding-images/examples/hexagon-midnight-void-spiral-897x897-2025-11-21-21-27.png"
              alt="Example 3"
              className="w-full h-auto rounded border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setFullSizeImage("/onboarding-images/examples/hexagon-midnight-void-spiral-897x897-2025-11-21-21-27.png")}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <img
              src="/onboarding-images/examples/pixels-cyber-matrix-pulse-897x897-2025-11-21-21-31.png"
              alt="Example 4"
              className="w-full h-auto rounded border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setFullSizeImage("/onboarding-images/examples/pixels-cyber-matrix-pulse-897x897-2025-11-21-21-31.png")}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <img
              src="/onboarding-images/examples/star-neon-pop-drift-897x897-2025-11-21-21-30.png"
              alt="Example 5"
              className="w-full h-auto rounded border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setFullSizeImage("/onboarding-images/examples/star-neon-pop-drift-897x897-2025-11-21-21-30.png")}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "sprites",
    title: "Sprites",
    description: "Shapes & size",
    heading: "Working with shapes",
    contentDescription: "Explore different shapes and control their size and quantity",
    icon: Shapes,
    content: (setFullSizeImage: (src: string) => void) => (
      <div className="space-y-4">
          <div className="flex items-start gap-6">
            <img
              src="/onboarding-images/sprites/shape.png"
              alt="Shape selection controls"
              className="w-32 h-auto rounded border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
              onClick={() => setFullSizeImage("/onboarding-images/sprites/shape.png")}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-2">Shape selection</h4>
              <div className="space-y-3">
                <div>
                  <strong className="text-xs">Select sprites</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Click any shape button to change all sprites on the canvas. Available shapes include circles, stars, hexagons, triangles, and more.</p>
                </div>
                <div>
                  <strong className="text-xs">Lock button</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Click the lock icon to prevent the shape from changing when you shuffle or regenerate. This lets you experiment with other settings while keeping your chosen shape.</p>
                </div>
                <div>
                  <strong className="text-xs">Regenerate</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Click the refresh button to randomly reposition and resize all sprites while keeping your current settings. Great for finding new compositions!</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-6 border-t border-[var(--text-subtle)]" />

          <div className="flex items-start gap-6">
            <img
              src="/onboarding-images/sprites/density+scale.png"
              alt="Density and scale controls"
              className="w-32 h-auto rounded border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
              onClick={() => setFullSizeImage("/onboarding-images/sprites/density+scale.png")}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-2">Density & scale</h4>
              <div className="space-y-3">
                <div>
                  <strong className="text-xs">Tile density</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Controls how many sprites appear per layer. Higher values create a busier, more crowded canvas. Lower values give you more breathing room.</p>
                </div>
                <div>
                  <strong className="text-xs">Scale base</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Sets the baseline size for all sprites before random variation is applied. Think of it as the average size.</p>
                </div>
                <div>
                  <strong className="text-xs">Scale range</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Controls how much sprites can vary in size. Higher values create more dramatic size differences between the smallest and largest sprites.</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-6 border-t border-[var(--text-subtle)]" />

          <div className="flex items-start gap-6">
            <img
              src="/onboarding-images/sprites/depth.png"
              alt="Depth of field controls"
              className="w-32 h-auto rounded border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
              onClick={() => setFullSizeImage("/onboarding-images/sprites/depth.png")}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-2">Depth of field</h4>
              <div className="space-y-3">
                <div>
                  <strong className="text-xs">Depth of field toggle</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Enable this to add realistic blur based on sprite distance. Larger sprites (closer) and smaller sprites (farther) get different blur amounts, creating a sense of depth.</p>
                </div>
                <div>
                  <strong className="text-xs">Focus</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Adjust which depth is in sharp focus. Objects at this depth remain crisp while others blur.</p>
                </div>
                <div>
                  <strong className="text-xs">Blur strength</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Controls how blurry objects become when out of focus. Does not affect objects on the focus plane.</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-6 border-t border-[var(--text-subtle)]" />

          <div className="flex items-start gap-6">
            <img
              src="/onboarding-images/sprites/rotation.png"
              alt="Rotation controls"
              className="w-32 h-auto rounded border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
              onClick={() => setFullSizeImage("/onboarding-images/sprites/rotation.png")}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-2">Rotation</h4>
              <div className="space-y-3">
                <div>
                  <strong className="text-xs">Rotation Offsets</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Enable to give each sprite a random static rotation angle. This adds visual variety without animation.</p>
                </div>
                <div>
                  <strong className="text-xs">Rotation Amount</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Sets the maximum angle sprites can rotate (0–180°). The actual rotation for each sprite is randomly distributed within this range.</p>
                </div>
              </div>
            </div>
          </div>
      </div>
    ),
  },
  {
    id: "colours",
    title: "Colours",
    description: "Colours & effects",
    heading: "Choosing your palette",
    contentDescription: "Select colours and create custom palettes from your photos",
    icon: Palette,
    content: (setFullSizeImage: (src: string) => void) => (
      <div className="space-y-4">
          <div className="flex items-start gap-6">
            <img
              src="/onboarding-images/colours/palette+variance.png"
              alt="Palette and variance controls"
              className="w-32 h-auto rounded border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
              onClick={() => setFullSizeImage("/onboarding-images/colours/palette+variance.png")}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-2">Palette & variance</h4>
              <div className="space-y-3">
                <div>
                  <strong className="text-xs">Sprite palette</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Choose from 20+ built-in colour palettes or create your own. The palette determines the base colours used for tinting sprites.</p>
                </div>
                <div>
                  <strong className="text-xs">Refresh button</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Re-applies the selected palette randomly across sprites, giving you a new colour distribution without changing the palette itself.</p>
                </div>
                <div>
                  <strong className="text-xs">Custom palettes (+ button)</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Click to open the custom palette manager. Upload a photo and extract colours to create your own unique palette!</p>
                </div>
                <div>
                  <strong className="text-xs">Use gradients</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Toggle to enable gradient fills for sprites instead of solid colours. Creates smooth colour transitions within each sprite.</p>
                </div>
                <div>
                  <strong className="text-xs">Sprite palette variance</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Controls how much each colour can drift away from the base palette swatches. Higher values create more colour variation.</p>
                </div>
                <div>
                  <strong className="text-xs">Sprite hue shift</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Shifts all palette colours around the colour wheel (0–360°). Great for creating different moods with the same palette.</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-6 border-t border-[var(--text-subtle)]" />

          <div className="flex items-start gap-6">
            <img
              src="/onboarding-images/colours/custom-palettes-upload.png"
              alt="Custom palette upload"
              className="w-32 h-auto rounded border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
              onClick={() => setFullSizeImage("/onboarding-images/colours/custom-palettes-upload.png")}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-2">Custom palettes - upload</h4>
              <div className="space-y-3">
                <div>
                  <strong className="text-xs">Upload photo</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Upload an image file from your device. The palette manager will extract the dominant colours from your photo to create a custom palette.</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-6 border-t border-[var(--text-subtle)]" />

          <div className="flex items-start gap-6">
            <img
              src="/onboarding-images/colours/custom-palettes-import.png"
              alt="Custom palette import"
              className="w-32 h-auto rounded border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
              onClick={() => setFullSizeImage("/onboarding-images/colours/custom-palettes-import.png")}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-2">Custom palettes - import</h4>
              <div className="space-y-3">
                <div>
                  <strong className="text-xs">Import palette</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Import a palette from a JSON file. Share palettes with others or restore previously saved custom palettes.</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-6 border-t border-[var(--text-subtle)]" />

          <div className="flex items-start gap-6">
            <img
              src="/onboarding-images/colours/custom-palettes-url.png"
              alt="Custom palette URL"
              className="w-32 h-auto rounded border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
              onClick={() => setFullSizeImage("/onboarding-images/colours/custom-palettes-url.png")}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-2">Custom palettes - URL</h4>
              <div className="space-y-3">
                <div>
                  <strong className="text-xs">Load from URL</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Enter an image URL to extract colours from an online image. Perfect for creating palettes from photos found on the web.</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-6 border-t border-[var(--text-subtle)]" />

          <div className="flex items-start gap-6">
            <img
              src="/onboarding-images/colours/blend+opacity.png"
              alt="Blend and opacity controls"
              className="w-32 h-auto rounded border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
              onClick={() => setFullSizeImage("/onboarding-images/colours/blend+opacity.png")}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-2">Blend & opacity</h4>
              <div className="space-y-3">
                <div>
                  <strong className="text-xs">Layer opacity</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Sets the base transparency for each rendered layer (15–100%). Lower values create more subtle, layered effects.</p>
                </div>
                <div>
                  <strong className="text-xs">Blend mode</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Choose how layers combine when they overlap. Options include Normal, Multiply, Screen, Overlay, and more. Each creates a different visual effect.</p>
                </div>
                <div>
                  <strong className="text-xs">Random sprite blend</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">When enabled, each sprite gets its own random blend mode. The refresh button randomises blend modes for all sprites.</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-6 border-t border-[var(--text-subtle)]" />

          <div className="flex items-start gap-6">
            <img
              src="/onboarding-images/colours/canvas.png"
              alt="Canvas background controls"
              className="w-32 h-auto rounded border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
              onClick={() => setFullSizeImage("/onboarding-images/colours/canvas.png")}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-2">Canvas background</h4>
              <div className="space-y-3">
                <div>
                  <strong className="text-xs">Canvas</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Choose the background colour or gradient theme. This appears behind all sprites and sets the overall mood of your composition.</p>
                </div>
                <div>
                  <strong className="text-xs">Use gradients</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Enable gradient fills for the canvas background instead of solid colour. Creates smooth transitions across the canvas.</p>
                </div>
                <div>
                  <strong className="text-xs">Canvas hue shift</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Shifts canvas colours around the colour wheel (0–360°). Adjusts the overall colour temperature of your background.</p>
                </div>
                <div>
                  <strong className="text-xs">Canvas brightness</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Adjusts the canvas brightness (0–100%). Lower values create darker, moodier backgrounds; higher values are brighter and more vibrant.</p>
                </div>
              </div>
            </div>
          </div>
      </div>
    ),
  },
  {
    id: "motion",
    title: "Motion",
    description: "Animation",
    heading: "Adding movement",
    contentDescription: "Control how your shapes move and animate across the canvas",
    icon: Zap,
    content: (setFullSizeImage: (src: string) => void) => (
      <div className="space-y-4">
          <div className="flex items-start gap-6">
            <img
              src="/onboarding-images/motion/animation.png"
              alt="Animation controls"
              className="w-32 h-auto rounded border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
              onClick={() => setFullSizeImage("/onboarding-images/motion/animation.png")}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-2">Animation</h4>
              <p className="text-xs leading-relaxed text-[var(--text-muted)] mb-2">
                Choose from 10 different animation patterns, each creating a unique movement style:
              </p>
              <div className="space-y-2">
                <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                  <strong className="text-[var(--text-primary)]">Pulse:</strong> Sprites pulse in and out from their centre, creating a breathing effect.
                </p>
                <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                  <strong className="text-[var(--text-primary)]">Drift:</strong> Gentle floating motion with smooth, organic movement.
                </p>
                <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                  <strong className="text-[var(--text-primary)]">Ripple:</strong> Wave-like motion that creates cascading effects across layers.
                </p>
                <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                  <strong className="text-[var(--text-primary)]">Zigzag:</strong> Angular back-and-forth motion with sharp directional changes.
                </p>
                <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                  <strong className="text-[var(--text-primary)]">Cascade:</strong> Flowing downward motion, like water or particles falling.
                </p>
                <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                  <strong className="text-[var(--text-primary)]">Spiral orbit:</strong> Circular spiral motion creating orbital patterns.
                </p>
                <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                  <strong className="text-[var(--text-primary)]">Comet trail:</strong> Trailing motion effect with directional movement.
                </p>
                <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                  <strong className="text-[var(--text-primary)]">Linear:</strong> Straight-line motion in consistent directions.
                </p>
                <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                  <strong className="text-[var(--text-primary)]">Isometric:</strong> Hexagonal grid-based motion with geometric precision.
                </p>
                <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                  <strong className="text-[var(--text-primary)]">Perspective:</strong> Tiles emit from centre and grow as they move outward, simulating a 3D zoom effect.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-6 mt-4">
            <div className="w-32 flex-shrink-0"></div>
            <div className="flex-1 p-4 rounded border border-[var(--card-border)] bg-[var(--card-bg)]">
              <div className="flex items-center gap-3 mb-2">
                <Info className="h-5 w-5 text-[var(--accent-primary)] flex-shrink-0" />
                <strong className="text-xs">Lock button</strong>
              </div>
              <p className="text-xs leading-relaxed text-[var(--text-muted)] ml-8">Click the lock icon to prevent the movement mode from changing when you shuffle settings.</p>
            </div>
          </div>

          <hr className="my-6 border-t border-[var(--text-subtle)]" />

          <div className="flex items-start gap-6">
            <img
              src="/onboarding-images/motion/animation.png"
              alt="Motion controls"
              className="w-32 h-auto rounded border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
              onClick={() => setFullSizeImage("/onboarding-images/motion/animation.png")}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-2">Motion controls</h4>
              <div className="space-y-3">
                <div>
                  <strong className="text-xs">Motion intensity</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Controls how far sprites travel within their chosen movement path (0–100%). Higher values create more dramatic movement; lower values are more subtle.</p>
                </div>
                <div>
                  <strong className="text-xs">Motion speed</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Controls how fast sprites move along their path (0–100%). Speed is normalised across all movement modes, so 100% feels consistent regardless of which mode you choose. Slower speeds can create a more calming, meditative effect.</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-6 border-t border-[var(--text-subtle)]" />

          <div className="flex items-start gap-6">
            <img
              src="/onboarding-images/motion/rotation.png"
              alt="Rotation animation controls"
              className="w-32 h-auto rounded border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
              onClick={() => setFullSizeImage("/onboarding-images/motion/rotation.png")}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-2">Rotation animation</h4>
              <div className="space-y-3">
                <div>
                  <strong className="text-xs">Animate rotation</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Enable continuous spinning when rotation offsets are enabled (from the Sprites tab). This adds dynamic rotation animation on top of static rotation offsets.</p>
                </div>
                <div>
                  <strong className="text-xs">Rotation speed</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Control how quickly sprites spin when rotation animation is enabled (0–100%). Higher values create faster spinning; lower values are more gentle.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-6 mt-4">
            <div className="w-32 flex-shrink-0"></div>
            <div className="flex-1 p-4 rounded border border-[var(--card-border)] bg-[var(--card-bg)]">
              <div className="flex items-center gap-3 mb-2">
                <Info className="h-5 w-5 text-[var(--accent-primary)] flex-shrink-0" />
                <strong className="text-xs">Tip</strong>
              </div>
              <p className="text-xs leading-relaxed text-[var(--text-muted)] ml-8">Combine movement modes with rotation animation for complex, layered motion effects!</p>
            </div>
          </div>
      </div>
    ),
  },
  {
    id: "exporting",
    title: "Exporting",
    description: "Save your art",
    heading: "Capturing your art",
    contentDescription: "Export your creations in various sizes and formats",
    icon: Camera,
    content: (setFullSizeImage: (src: string) => void) => (
      <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Opening the export dialog</h4>
            <div className="space-y-3">
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">Click the <strong>camera icon</strong> in the status bar (bottom right) to open the export modal.</p>
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">The animation automatically pauses when you open the export dialog, ensuring you capture a crisp, clear image.</p>
            </div>
          </div>

          <hr className="my-6 border-t border-[var(--text-subtle)]" />

          <div className="flex items-start gap-6">
            <img
              src="/onboarding-images/export/export.png"
              alt="Default export view"
              className="w-32 h-auto rounded border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
              onClick={() => setFullSizeImage("/onboarding-images/export/export.png")}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-2">Default view</h4>
              <div className="space-y-3">
                <div>
                  <strong className="text-xs">Quick export</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Export your current canvas size with one click. Use Download, Copy, or Share buttons to save or share your image.</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-6 border-t border-[var(--text-subtle)]" />

          <div className="flex items-start gap-6">
            <img
              src="/onboarding-images/export/export-advanced.png"
              alt="Advanced export options"
              className="w-32 h-auto rounded border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
              onClick={() => setFullSizeImage("/onboarding-images/export/export-advanced.png")}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-2">Advanced options</h4>
              <div className="space-y-3">
                <div>
                  <strong className="text-xs">Dimension presets</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Quick presets for social media, wallpapers, and print sizes. Select a preset to automatically set dimensions.</p>
                </div>
                <div>
                  <strong className="text-xs">Custom dimensions</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Enter custom width and height (100px to 16384px). Lock aspect ratio to maintain proportions when adjusting.</p>
                </div>
                <div>
                  <strong className="text-xs">Export format</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">All exports are saved as high-quality PNG files. Large exports may take a few moments to process.</p>
                </div>
              </div>
            </div>
          </div>
      </div>
    ),
  },
  {
    id: "presets",
    title: "Presets",
    description: "Save & load",
    heading: "Saving your favorites",
    contentDescription: "Save and manage your favorite settings combinations",
    icon: Bookmark,
    content: (setFullSizeImage: (src: string) => void) => (
      <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Opening the preset manager</h4>
            <div className="space-y-3">
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">Click the <strong>bookmark icon</strong> in the status bar (bottom right) to open the preset manager.</p>
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">The preset manager lets you save, load, import, and export your favorite settings combinations.</p>
            </div>
          </div>

          <hr className="my-6 border-t border-[var(--text-subtle)]" />

          <div className="flex items-start gap-6">
            <img
              src="/onboarding-images/presets/presets-save.png"
              alt="Saving presets"
              className="w-32 h-auto rounded border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
              onClick={() => setFullSizeImage("/onboarding-images/presets/presets-save.png")}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-2">Saving presets</h4>
              <div className="space-y-3">
                <div>
                  <strong className="text-xs">Save view</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Enter a name for your preset in the input field. This saves all current settings including shapes, colours, motion, and effects.</p>
                </div>
                <div>
                  <strong className="text-xs">Save button</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Click to save your current settings as a new preset. The preset is stored locally in your browser.</p>
                </div>
                <div>
                  <strong className="text-xs">Export all</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Export all your saved presets as a JSON file. Great for backing up your work or sharing presets with others!</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-6 border-t border-[var(--text-subtle)]" />

          <div className="flex items-start gap-6">
            <img
              src="/onboarding-images/presets/presets-load.png"
              alt="Loading presets"
              className="w-32 h-auto rounded border border-[var(--card-border)] cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
              onClick={() => setFullSizeImage("/onboarding-images/presets/presets-load.png")}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-2">Loading presets</h4>
              <div className="space-y-3">
                <div>
                  <strong className="text-xs">Load view</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Select a preset from the dropdown menu. All your saved presets are listed here.</p>
                </div>
                <div>
                  <strong className="text-xs">Load button</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Click to instantly apply all settings from the selected preset. Your canvas will update immediately.</p>
                </div>
                <div>
                  <strong className="text-xs">Import button</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Import presets from a JSON file. Perfect for restoring backups or using presets shared by others.</p>
                </div>
                <div>
                  <strong className="text-xs">Delete button</strong>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)] mt-1">Remove a preset you no longer need. This action cannot be undone, so be careful!</p>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-6 border-t border-[var(--text-subtle)]" />

          <div className="flex items-start gap-6">
            <div className="w-32 flex-shrink-0"></div>
            <div className="flex-1 p-4 rounded border border-[var(--card-border)] bg-[var(--card-bg)]">
              <div className="flex items-center gap-3 mb-2">
                <Info className="h-5 w-5 text-[var(--accent-primary)] flex-shrink-0" />
                <h4 className="text-sm font-semibold">Tips</h4>
              </div>
              <ul className="space-y-2 text-xs leading-relaxed text-[var(--text-muted)] ml-8">
              <li className="flex items-baseline gap-2">
                <span className="text-[var(--accent-primary)]">•</span>
                <span>Use descriptive names for your presets (e.g., "Sunset Warmth", "Ocean Blues", "Minimalist Circles") to easily find them later.</span>
              </li>
              <li className="flex items-baseline gap-2">
                <span className="text-[var(--accent-primary)]">•</span>
                <span>Export your presets regularly as a backup. If you clear your browser data, you can restore them with the import function.</span>
              </li>
              <li className="flex items-baseline gap-2">
                <span className="text-[var(--accent-primary)]">•</span>
                <span>Share preset files with friends! They can import them to use your exact settings.</span>
              </li>
            </ul>
            </div>
          </div>
      </div>
    ),
  },
];

export function OnboardingPanel({ isOpen, onClose }: OnboardingPanelProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [animatingStep, setAnimatingStep] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [fullSizeImage, setFullSizeImage] = useState<string | null>(null);

  // Viewport-based mobile detection (< 640px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setCurrentStep(0);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex !== currentStep) {
      setAnimatingStep(stepIndex);
      setCurrentStep(stepIndex);
      // Reset animation state after animation completes
      setTimeout(() => {
        setAnimatingStep(null);
      }, 600);
    }
  };

  const handleComplete = () => {
    markWelcomeSeen();
    markTourCompleted();
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isOpen || !isVisible) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === ONBOARDING_STEPS.length - 1;
  const StepIcon = step.icon;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(4px)",
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
        onClick={handleSkip}
      />

      {/* Onboarding Panel */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${isMobile ? "p-2" : "p-4"}`}
        style={{
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.2s ease",
          pointerEvents: "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Card
          className={`w-full overflow-hidden flex flex-col ${isMobile ? "max-w-full" : "max-w-4xl"}`}
          style={{
            transform: isVisible ? "scale(1)" : "scale(0.95)",
            transition: "transform 0.2s ease",
            pointerEvents: "auto",
            height: "85vh",
            maxHeight: "85vh",
          }}
        >
          <div className={`flex items-center justify-between border-b border-[var(--card-border)] ${isMobile ? "p-4" : "p-6"}`}>
            <div className="onboarding-logo-wrapper">
              <PixliLogo className="app-logo-svg" />
            </div>
            <button
              type="button"
              className="preset-manager-close"
              onClick={handleSkip}
              aria-label="Close onboarding"
            >
              ×
            </button>
          </div>

          <div className={`flex flex-1 overflow-hidden ${isMobile ? "flex-col" : ""}`}>
            {/* Stepper - Vertical on desktop, Dropdown on mobile */}
            {isMobile ? (
              /* Dropdown selector for mobile */
              <div className="w-full border-b border-[var(--panel-border)] p-4">
                <Select
                  value={currentStep.toString()}
                  onValueChange={(value) => handleStepClick(parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {(() => {
                        const step = ONBOARDING_STEPS[currentStep];
                        const StepIconComponent = step.icon;
                        return (
                          <>
                            <div className={`
                              flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
                              border-[var(--accent-primary)] bg-[var(--accent-primary)]
                            `}>
                              <StepIconComponent className="h-3 w-3 text-[var(--accent-primary-contrast)]" />
                            </div>
                            <SelectValue placeholder="Select a step...">
                              <span className="text-xs font-semibold">{step.title}</span>
                            </SelectValue>
                          </>
                        );
                      })()}
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {ONBOARDING_STEPS.map((s, index) => {
                        const StepIconComponent = s.icon;
                        const isActive = index === currentStep;
                        return (
                          <SelectItem key={s.id} value={index.toString()}>
                            <div className="flex items-center gap-2">
                              <div className={`
                                flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
                                ${isActive 
                                  ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]" 
                                  : "border-[var(--panel-border)] bg-[var(--panel-bg)]"
                                }
                              `}>
                                <StepIconComponent className={`h-3 w-3 ${isActive ? "text-[var(--accent-primary-contrast)]" : "text-[var(--text-muted)]"}`} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold">{s.title}</span>
                                <span className="text-xs text-[var(--text-muted)]">{s.description}</span>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              /* Vertical Stepper for desktop */
              <div className="w-64 flex flex-col overflow-hidden">
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="overflow-y-auto overflow-x-hidden">
                    {ONBOARDING_STEPS.map((s, index) => {
                      const StepIconComponent = s.icon;
                      const isActive = index === currentStep;
                      const isFirst = index === 0;
                      const isLast = index === ONBOARDING_STEPS.length - 1;

                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleStepClick(index)}
                          className={`
                            text-left py-3 px-4 border-2
                            ${isFirst ? "border-t-0 rounded-tl-none" : "border-t-0"}
                            ${isLast ? "rounded-bl-none" : ""}
                            ${isActive 
                              ? "bg-transparent text-[var(--text-color)] border-r-0" 
                              : ""
                            }
                          `}
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            borderLeft: "none",
                            borderRight: isActive ? "none" : "2px solid var(--panel-border)",
                            borderTop: "none",
                            borderBottom: "2px solid var(--panel-border)",
                            borderColor: "var(--panel-border)",
                            transition: "background 0.18s ease",
                            ...(isActive ? {} : {
                              background: "linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), var(--panel-bg)",
                            }),
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background = "linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.1)), var(--panel-bg)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.background = "linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), var(--panel-bg)";
                            }
                          }}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className={`
                              flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center
                              ${isActive 
                                ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]" 
                                : "border-[var(--panel-border)] bg-[var(--panel-bg)]"
                              }
                            `}>
                              <StepIconComponent className={`h-4 w-4 ${isActive ? "text-[var(--accent-primary-contrast)]" : "text-[var(--text-muted)]"} ${animatingStep === index ? "tab-icon-spring" : ""}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-xs font-semibold`}>
                                {s.title}
                              </div>
                              <div className="text-xs text-[var(--text-muted)]">
                                {s.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {/* Empty tab to fill remaining space */}
                  <div 
                    className="flex-1"
                    style={{
                      borderRight: "2px solid var(--panel-border)",
                      borderTop: "none",
                      borderBottom: "none",
                      borderLeft: "none",
                      background: "linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), var(--panel-bg)",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className={`flex-1 overflow-y-auto ${isMobile ? "p-4" : "p-6"}`}>
              <div className="flex items-start gap-3 mb-4">
                <div className={`
                  flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center
                  border-[var(--accent-primary)] bg-[var(--accent-primary)]
                `}>
                  <StepIcon className="h-5 w-5 text-[var(--accent-primary-contrast)]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold tracking-wider mb-1">
                    {step.heading || step.title}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mb-4">
                    {step.contentDescription || step.description}
                  </p>
                </div>
              </div>
              <div className="ml-0 space-y-4">
                {step.content(setFullSizeImage)}
              </div>
            </div>
          </div>

          {/* Navigation Footer */}
          <div className={`flex items-center border-t border-[var(--card-border)] ${isMobile ? "p-4" : "p-6"}`}>
            <div className="flex-1">
              {!isFirst && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              )}
            </div>
            <div className="flex-1 flex justify-center">
              <span className="text-xs text-[var(--text-muted)]">
                {currentStep + 1} of {ONBOARDING_STEPS.length}
              </span>
            </div>
            <div className="flex-1 flex justify-end">
              <Button
                type="button"
                variant="default"
                size="md"
                onClick={handleNext}
              >
                {isLast ? "Finish" : "Next"}
                {!isLast && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Full-size Image Modal */}
      {fullSizeImage && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
            onClick={() => setFullSizeImage(null)}
            style={{
              opacity: fullSizeImage ? 1 : 0,
              transition: "opacity 0.2s ease",
            }}
          />
          <div
            className="fixed inset-0 z-[61] flex items-center justify-center p-4"
            onClick={() => setFullSizeImage(null)}
            style={{
              opacity: fullSizeImage ? 1 : 0,
              transition: "opacity 0.2s ease",
            }}
          >
            <div
              className="relative max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="preset-manager-close absolute -top-10 right-0 text-[var(--text-primary)] hover:opacity-80"
                onClick={() => setFullSizeImage(null)}
                aria-label="Close image"
              >
                <X className="h-6 w-6" />
              </button>
              <img
                src={fullSizeImage}
                alt="Full size preview"
                className="max-w-full max-h-[90vh] object-contain rounded border-2 border-[var(--card-border)]"
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}

