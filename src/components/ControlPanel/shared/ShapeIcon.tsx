import type { SpriteMode } from "@/types/generator";
import { useState, useEffect } from "react";

interface ShapeIconProps {
  shape: SpriteMode;
  size?: number;
  svgPath?: string; // Optional SVG path for custom sprite icons
  "data-slot"?: string; // For Catalyst icon button pattern
}

/**
 * ShapeIcon Component
 * 
 * Renders SVG icons for different sprite shapes.
 * Used in the sprite selection buttons to provide visual previews.
 */
export function ShapeIcon({ shape, size = 24, svgPath, "data-slot": dataSlot }: ShapeIconProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [svgError, setSvgError] = useState(false);

  // Load SVG if svgPath is provided
  useEffect(() => {
    if (svgPath) {
      fetch(svgPath)
        .then((res) => res.text())
        .then((text) => setSvgContent(text))
        .catch(() => setSvgError(true));
    }
  }, [svgPath]);

  // If SVG path is provided and loaded, render the SVG directly
  if (svgPath && svgContent && !svgError) {
    // Parse the SVG to extract viewBox and inner content
    const svgMatch = svgContent.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
    if (!svgMatch) {
      return null;
    }
    
    let innerContent = svgMatch[1];
    // Extract viewBox from original SVG, or use default
    const viewBoxMatch = svgContent.match(/viewBox="([^"]*)"/i);
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 24 24";
    
    // Parse viewBox to get dimensions
    const viewBoxParts = viewBox.split(/\s+/).map(v => parseFloat(v));
    const viewBoxWidth = viewBoxParts[2] || 24;
    const viewBoxHeight = viewBoxParts[3] || 24;
    
    // Remove background/frame rectangles
    // These are typically full-size rectangles positioned at (0,0) or very close to viewBox size
    // Match both self-closing and paired rect tags
    innerContent = innerContent.replace(/<rect[^>]*\/?\s*>/gi, (match) => {
      const widthMatch = match.match(/width=["']?([0-9.]+)["']?/i);
      const heightMatch = match.match(/height=["']?([0-9.]+)["']?/i);
      const xMatch = match.match(/x=["']?([0-9.-]+)["']?/i);
      const yMatch = match.match(/y=["']?([0-9.-]+)["']?/i);
      
      if (widthMatch && heightMatch) {
        const width = parseFloat(widthMatch[1]);
        const height = parseFloat(heightMatch[1]);
        const x = xMatch ? parseFloat(xMatch[1]) : 0;
        const y = yMatch ? parseFloat(yMatch[1]) : 0;
        
        // Check if this is a full-size background rectangle
        const isFullWidth = Math.abs(width - viewBoxWidth) < 0.5;
        const isFullHeight = Math.abs(height - viewBoxHeight) < 0.5;
        const isAtOrigin = Math.abs(x) < 0.5 && Math.abs(y) < 0.5;
        
        // If it's a full-size rect at origin, remove it (it's likely a frame/background)
        if (isFullWidth && isFullHeight && isAtOrigin) {
          return '';
        }
      }
      
      return match;
    });
    
    // Clean up any orphaned closing tags
    innerContent = innerContent.replace(/<\/rect>/gi, '');
    
    // Replace fill colors with currentColor for theming (white/black based on theme)
    // This makes SVG icons follow the theme like primitive icons do
    let processedContent = innerContent
      .replace(/fill="[^"]*"/g, 'fill="currentColor"')
      .replace(/fill:[^;"]+/g, 'fill:currentColor')
      .replace(/stroke="[^"]*"/g, 'stroke="currentColor"')
      .replace(/stroke:[^;"]+/g, 'stroke:currentColor');
    
    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        style={{ display: "block", overflow: "visible" }}
        fill="currentColor"
        data-slot={dataSlot}
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    );
  }

  // Fallback to shape rendering if SVG loading failed or not provided
  if (svgPath && svgError) {
    // Show a placeholder if SVG fails to load
    return (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "currentColor",
          opacity: 0.2,
          borderRadius: "4px",
        }}
      />
    );
  }

  const viewBox = "0 0 24 24";
  const center = 12;
  const radius = 8;

  const renderShape = () => {
    switch (shape) {
      case "circle":
        return (
          <circle cx={center} cy={center} r={radius * 1.2} fill="currentColor" />
        );

      case "square":
        return <rect x={4} y={4} width={16} height={16} fill="currentColor" />;

      case "rounded":
        return (
          <rect
            x={4}
            y={4}
            width={16}
            height={16}
            rx={3}
            ry={3}
            fill="currentColor"
          />
        );

      case "triangle":
        return (
          <polygon
            points={`${center},3 21,21 3,21`}
            fill="currentColor"
          />
        );

      case "hexagon": {
        const hexRadius = radius * 1.2; // Make hexagon bigger
        const points = [];
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const x = center + hexRadius * Math.cos(angle);
          const y = center + hexRadius * Math.sin(angle);
          points.push(`${x},${y}`);
        }
        return <polygon points={points.join(" ")} fill="currentColor" />;
      }

      case "ring":
        return (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
          />
        );

      case "diamond": {
        const diamondSize = 9; // Make diamond bigger
        return (
          <polygon
            points={`${center},${center - diamondSize} ${center + diamondSize},${center} ${center},${center + diamondSize} ${center - diamondSize},${center}`}
            fill="currentColor"
          />
        );
      }

      case "star": {
        const outerRadius = radius * 1.45; // Make star bigger
        const innerRadius = radius * 0.6; // Adjust inner radius proportionally
        const points = [];
        for (let i = 0; i < 10; i++) {
          const angle = (Math.PI / 5) * i - Math.PI / 2;
          const r = i % 2 === 0 ? outerRadius : innerRadius;
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          points.push(`${x},${y}`);
        }
        return <polygon points={points.join(" ")} fill="currentColor" />;
      }

      case "line":
        return <rect x={2} y={10} width={20} height={4} fill="currentColor" />;

      case "pentagon": {
        const points = [];
        for (let i = 0; i < 5; i += 1) {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const pentagonRadius = radius * 1.25;
          const x = center + pentagonRadius * Math.cos(angle);
          const y = center + pentagonRadius * Math.sin(angle);
          points.push(`${x},${y}`);
        }
        return <polygon points={points.join(" ")} fill="currentColor" />;
      }

      case "asterisk": {
        // Asterisk shape - viewBox 0 0 16 16, scaled down and centered
        const baseScale = 24 / 16; // Scale from 16x16 to 24x24
        const scale = baseScale * 0.8; // Make 20% smaller
        const offsetX = (24 - 16 * scale) / 2; // Center horizontally
        const offsetY = (24 - 16 * scale) / 2; // Center vertically
        return (
          <g transform={`translate(${offsetX}, ${offsetY}) scale(${scale})`}>
            <path
              d="M15.9 5.7l-2-3.4-3.9 2.2v-4.5h-4v4.5l-4-2.2-2 3.4 3.9 2.3-3.9 2.3 2 3.4 4-2.2v4.5h4v-4.5l3.9 2.2 2-3.4-4-2.3z"
              fill="currentColor"
            />
          </g>
        );
      }

      case "cross": {
        // Cross shape - viewBox 0 0 16 16, scaled down and centered
        const baseScale = 24 / 16; // Scale from 16x16 to 24x24
        const scale = baseScale * 0.8; // Make 20% smaller
        const offsetX = (24 - 16 * scale) / 2; // Center horizontally
        const offsetY = (24 - 16 * scale) / 2; // Center vertically
        return (
          <g transform={`translate(${offsetX}, ${offsetY}) scale(${scale})`}>
            <path
              d="M10 1H6V6L1 6V10H6V15H10V10H15V6L10 6V1Z"
              fill="currentColor"
            />
          </g>
        );
      }

      case "pixels": {
        // 4x4 grid of squares - matches SVG pattern from viewBox 0 0 17 17
        // Original: 16 squares, each 3x3 units, with 1 unit gaps
        // Scale to fit 24x24 icon viewBox, then make 10% smaller
        const baseScale = 24 / 17; // Scale factor from 17x17 to 24x24
        const scale = baseScale * 0.9; // Make 10% smaller
        const squareSize = 3 * scale;
        const gap = 1 * scale;
        const totalSize = 4 * squareSize + 3 * gap;
        const startX = (24 - totalSize) / 2; // Center the grid
        const startY = (24 - totalSize) / 2;
        
        return (
          <g>
            {Array.from({ length: 16 }, (_, i) => {
              const row = Math.floor(i / 4);
              const col = i % 4;
              const x = startX + col * (squareSize + gap);
              const y = startY + row * (squareSize + gap);
              return (
                <rect 
                  key={i} 
                  x={x} 
                  y={y} 
                  width={squareSize} 
                  height={squareSize} 
                  fill="currentColor"
                  stroke="none"
                />
              );
            })}
          </g>
        );
      }

      case "heart": {
        // Heart shape from Clarity Design System (MIT License)
        // Original viewBox: 0 0 36 36, scaled to fit 24x24 icon viewBox
        // Path needs to be scaled and centered
        const scale = 24 / 36; // Scale from 36x36 to 24x24
        const offsetX = (24 - 36 * scale) / 2; // Center horizontally
        const offsetY = (24 - 36 * scale) / 2; // Center vertically
        return (
          <g transform={`translate(${offsetX}, ${offsetY}) scale(${scale})`}>
            <path
              d="M33,7.64c-1.34-2.75-5.2-5-9.69-3.69A9.87,9.87,0,0,0,18,7.72a9.87,9.87,0,0,0-5.31-3.77C8.19,2.66,4.34,4.89,3,7.64c-1.88,3.85-1.1,8.18,2.32,12.87C8,24.18,11.83,27.9,17.39,32.22a1,1,0,0,0,1.23,0c5.55-4.31,9.39-8,12.07-11.71C34.1,15.82,34.88,11.49,33,7.64Z"
              fill="currentColor"
            />
          </g>
        );
      }

      case "snowflake": {
        // Snowflake shape - viewBox 0 0 24 24
        return (
          <path
            d="M21.16,16.13l-2-1.15.89-.24a1,1,0,1,0-.52-1.93l-2.82.76L14,12l2.71-1.57,2.82.76.26,0a1,1,0,0,0,.26-2L19.16,9l2-1.15a1,1,0,0,0-1-1.74L18,7.37l.3-1.11a1,1,0,1,0-1.93-.52l-.82,3L13,10.27V7.14l2.07-2.07a1,1,0,0,0,0-1.41,1,1,0,0,0-1.42,0L13,4.31V2a1,1,0,0,0-2,0V4.47l-.81-.81a1,1,0,0,0-1.42,0,1,1,0,0,0,0,1.41L11,7.3v3L8.43,8.78l-.82-3a1,1,0,1,0-1.93.52L6,7.37,3.84,6.13a1,1,0,0,0-1,1.74L4.84,9,4,9.26a1,1,0,0,0,.26,2l.26,0,2.82-.76L10,12,7.29,13.57l-2.82-.76A1,1,0,1,0,4,14.74l.89.24-2,1.15a1,1,0,0,0,1,1.74L6,16.63l-.3,1.11A1,1,0,0,0,6.39,19a1.15,1.15,0,0,0,.26,0,1,1,0,0,0,1-.74l.82-3L11,13.73v3.13L8.93,18.93a1,1,0,0,0,0,1.41,1,1,0,0,0,.71.3,1,1,0,0,0,.71-.3l.65-.65V22a1,1,0,0,0,2,0V19.53l.81.81a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.41L13,16.7v-3l2.57,1.49.82,3a1,1,0,0,0,1,.74,1.15,1.15,0,0,0,.26,0,1,1,0,0,0,.71-1.23L18,16.63l2.14,1.24a1,1,0,1,0,1-1.74Z"
            fill="currentColor"
          />
        );
      }

      case "smiley": {
        // Smiley face - viewBox 0 0 256 256, scaled to fit 24x24 icon viewBox
        const scale = 24 / 256; // Scale from 256x256 to 24x24
        const offsetX = (24 - 256 * scale) / 2; // Center horizontally
        const offsetY = (24 - 256 * scale) / 2; // Center vertically
        return (
          <g transform={`translate(${offsetX}, ${offsetY}) scale(${scale})`}>
            <path
              d="M128,24A104,104,0,1,0,232,128,104.12041,104.12041,0,0,0,128,24Zm36,72a12,12,0,1,1-12,12A12.0006,12.0006,0,0,1,164,96ZM92,96a12,12,0,1,1-12,12A12.0006,12.0006,0,0,1,92,96Zm84.50488,60.00293a56.01609,56.01609,0,0,1-97.00976.00049,8.00016,8.00016,0,1,1,13.85058-8.01074,40.01628,40.01628,0,0,0,69.30957-.00049,7.99974,7.99974,0,1,1,13.84961,8.01074Z"
              fill="currentColor"
            />
          </g>
        );
      }

      case "tree": {
        // Tree shape - viewBox 0 0 256 256, scaled to fit 24x24 icon viewBox
        const scale = 24 / 256; // Scale from 256x256 to 24x24
        const offsetX = (24 - 256 * scale) / 2; // Center horizontally
        const offsetY = (24 - 256 * scale) / 2; // Center vertically
        return (
          <g transform={`translate(${offsetX}, ${offsetY}) scale(${scale})`}>
            <path
              d="M231.18652,195.51465A7.9997,7.9997,0,0,1,224,200H136v40a8,8,0,0,1-16,0V200H32a7.99958,7.99958,0,0,1-6.31445-12.91113L71.64258,128H48a8.00019,8.00019,0,0,1-6.34082-12.87793l80-104a8,8,0,0,1,12.68164,0l80,104A8.00019,8.00019,0,0,1,208,128H184.35742l45.957,59.08887A7.99813,7.99813,0,0,1,231.18652,195.51465Z"
              fill="currentColor"
            />
          </g>
        );
      }

      case "x": {
        // X shape - viewBox 0 0 1920 1920, scaled to fit 24x24 icon viewBox
        const scale = 24 / 1920; // Scale from 1920x1920 to 24x24
        const offsetX = (24 - 1920 * scale) / 2; // Center horizontally
        const offsetY = (24 - 1920 * scale) / 2; // Center vertically
        return (
          <g transform={`translate(${offsetX}, ${offsetY}) scale(${scale})`}>
            <path
              d="M797.32 985.882 344.772 1438.43l188.561 188.562 452.549-452.549 452.548 452.549 188.562-188.562-452.549-452.548 452.549-452.549-188.562-188.561L985.882 797.32 533.333 344.772 344.772 533.333z"
              fill="currentColor"
            />
          </g>
        );
      }

      case "arrow": {
        // Arrow shape - viewBox 0 0 385.756 385.756, scaled smaller and centered
        const baseScale = 24 / 385.756; // Scale from 385.756x385.756 to 24x24
        const scale = baseScale * 0.75; // Make 25% smaller (10% more than previous 15%)
        const offsetX = (24 - 385.756 * scale) / 2; // Center horizontally
        const offsetY = (24 - 385.756 * scale) / 2; // Center vertically
        return (
          <g transform={`translate(${offsetX}, ${offsetY}) scale(${scale})`}>
            <path
              d="M377.816,7.492C372.504,2.148,366.088,0,358.608,0H98.544c-15.44,0-29.08,10.988-29.08,26.428v23.724c0,15.44,13.64,29.848,29.08,29.848h152.924L8.464,322.08c-5.268,5.272-8.172,11.84-8.176,19.34c0,7.5,2.908,14.296,8.176,19.568L25.24,377.64c5.264,5.272,12.296,8.116,19.796,8.116s13.768-2.928,19.036-8.2l241.392-242.172v151.124c0,15.444,14.084,29.492,29.52,29.492h23.732c15.432,0,26.752-14.048,26.752-29.492V26.52C385.464,19.048,383.144,12.788,377.816,7.492z"
              fill="currentColor"
            />
          </g>
        );
      }

      default:
        return (
          <circle cx={center} cy={center} r={radius} fill="currentColor" />
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      style={{ display: "block" }}
      fill="currentColor"
      data-slot={dataSlot}
    >
      {renderShape()}
    </svg>
  );
}
