/**
 * SVG Optimization Utility
 * 
 * Extracted from spriteImageLoader.ts for reuse in sprite management UI.
 * Provides SVG optimization using SVGO, similar to SVGOMG.
 */

import { optimize, type Config } from 'svgo';

/**
 * SVGO configuration optimized for sprite SVGs
 * Similar to SVGOMG defaults but tuned for removing Icons8 artifacts
 */
const svgoConfig: Config = {
  multipass: true, // Multiple optimization passes for better results
  plugins: [
    // Remove metadata and editor-specific content
    {
      name: 'removeDoctype',
    },
    {
      name: 'removeXMLProcInst',
    },
    {
      name: 'removeComments',
    },
    {
      name: 'removeMetadata',
    },
    {
      name: 'removeTitle',
    },
    {
      name: 'removeDesc',
    },
    {
      name: 'removeUselessDefs',
 // Remove unused definitions (important for removing clipping masks)
    },
    {
      name: 'removeEditorsNSData',
    },
    {
      name: 'removeEmptyAttrs',
    },
    {
      name: 'removeHiddenElems',
 // Remove hidden elements
    },
    {
      name: 'removeEmptyText',
    },
    {
      name: 'removeEmptyContainers',
    },
    // Clean up IDs (can break references to removed clipPaths)
    {
      name: 'cleanupIds',
      params: {
        remove: true,
        minify: false,
      },
    },
    // Simplify paths and shapes
    {
      name: 'convertPathData',
    },
    {
      name: 'cleanupNumericValues',
    },
    // Remove unused attributes
    {
      name: 'removeUselessStrokeAndFill',
    },
    {
      name: 'removeUnknownsAndDefaults',
    },
  ],
};

/**
 * Optimize SVG content using SVGO
 * Returns optimized SVG string and size metrics
 * 
 * @param svgContent - Raw SVG string content
 * @returns Promise with optimized SVG and size information
 */
export async function optimizeSvg(
  svgContent: string
): Promise<{ optimized: string; originalSize: number; optimizedSize: number }> {
  const originalSize = new Blob([svgContent], { type: 'text/plain' }).size;
  
  let optimized: string;
  try {
    const result = optimize(svgContent, svgoConfig);
    optimized = result.data;
  } catch (error) {
    console.warn('SVGO optimization failed, using original SVG:', error);
    optimized = svgContent;
  }
  
  const optimizedSize = new Blob([optimized], { type: 'text/plain' }).size;
  
  return {
    optimized,
    originalSize,
    optimizedSize,
  };
}

/**
 * Validate SVG content
 * Checks if the string is a valid SVG
 * 
 * @param svgContent - SVG string to validate
 * @returns true if valid SVG, false otherwise
 */
export function validateSvg(svgContent: string): boolean {
  if (!svgContent || typeof svgContent !== 'string') {
    return false;
  }
  
  // Basic validation: check for SVG tag
  const svgTagMatch = svgContent.match(/<svg[^>]*>/i);
  if (!svgTagMatch) {
    return false;
  }
  
  // Check for closing tag
  const hasClosingTag = svgContent.includes('</svg>');
  if (!hasClosingTag) {
    return false;
  }
  
  return true;
}

/**
 * Remove frame/background rectangles from SVG
 * Removes full-size rectangles that match viewBox dimensions (common in Icons8 SVGs)
 * Also removes stroke attributes that might create visible outlines/frames
 * 
 * @param svgContent - SVG string to process
 * @returns SVG with frames removed
 */
export function removeSvgFrames(svgContent: string): string {
  let processedSvg = svgContent;
  
  // Extract viewBox from SVG for frame detection
  const viewBoxMatch = processedSvg.match(/viewBox=["']?([0-9.\s-]+)["']?/i);
  const viewBoxWidth = viewBoxMatch ? (parseFloat(viewBoxMatch[1].trim().split(/[\s,]+/)[2]) || 30) : 30;
  const viewBoxHeight = viewBoxMatch ? (parseFloat(viewBoxMatch[1].trim().split(/[\s,]+/)[3]) || 30) : 30;
  
  // Remove any remaining background/frame rectangles that SVGO might have missed
  // These are typically full-size rectangles positioned at (0,0) matching viewBox size
  processedSvg = processedSvg.replace(/<rect[^>]*\/?\s*>/gi, (match) => {
    const widthMatch = match.match(/width=["']?([0-9.]+)["']?/i);
    const heightMatch = match.match(/height=["']?([0-9.]+)["']?/i);
    const xMatch = match.match(/x=["']?([0-9.-]+)["']?/i);
    const yMatch = match.match(/y=["']?([0-9.-]+)["']?/i);
    
    if (widthMatch && heightMatch) {
      const width = parseFloat(widthMatch[1]);
      const height = parseFloat(heightMatch[1]);
      const x = xMatch ? parseFloat(xMatch[1]) : 0;
      const y = yMatch ? parseFloat(yMatch[1]) : 0;
      
      // Check if this is a full-size background rectangle at origin
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
  processedSvg = processedSvg.replace(/<\/rect>/gi, '');
  
  // Remove any stroke attributes that might create visible outlines/frames
  // These can create frame-like artifacts even if there's no actual rectangle
  processedSvg = processedSvg.replace(/stroke-width=["'][^"']+["']/gi, '');
  processedSvg = processedSvg.replace(/stroke-width:[^;"]+/gi, '');
  processedSvg = processedSvg.replace(/stroke=["'][^"']+["']/gi, 'stroke="none"');
  processedSvg = processedSvg.replace(/stroke:[^;"]+/gi, 'stroke:none');
  
  return processedSvg;
}

/**
 * Extract potential sprite name from SVG
 * Tries to find name from <title> tag or comments
 * 
 * @param svgContent - SVG string to parse
 * @returns Extracted name or null
 */
export function extractSpriteNameFromSvg(svgContent: string): string | null {
  // Try to extract from <title> tag
  const titleMatch = svgContent.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }
  
  // Try to extract from filename in comments
  const commentMatch = svgContent.match(/<!--\s*.*?([^\/\\]+)\.svg/i);
  if (commentMatch && commentMatch[1]) {
    return commentMatch[1].trim();
  }
  
  return null;
}

