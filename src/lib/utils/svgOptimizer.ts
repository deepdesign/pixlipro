/**
 * SVG Optimization Utility
 * 
 * Extracted from spriteImageLoader.ts for reuse in sprite management UI.
 * Provides SVG optimization using SVGO, similar to SVGOMG.
 */

import { optimize, type Config } from 'svgo';
import getBounds from 'svg-path-bounds';

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
      active: true,
    },
    {
      name: 'removeXMLProcInst',
      active: true,
    },
    {
      name: 'removeComments',
      active: true,
    },
    {
      name: 'removeMetadata',
      active: true,
    },
    {
      name: 'removeTitle',
      active: true,
    },
    {
      name: 'removeDesc',
      active: true,
    },
    {
      name: 'removeUselessDefs',
      active: true, // Remove unused definitions (important for removing clipping masks)
    },
    {
      name: 'removeEditorsNSData',
      active: true,
    },
    {
      name: 'removeEmptyAttrs',
      active: true,
    },
    {
      name: 'removeHiddenElems',
      active: true, // Remove hidden elements
    },
    {
      name: 'removeEmptyText',
      active: true,
    },
    {
      name: 'removeEmptyContainers',
      active: true,
    },
    // Clean up IDs (can break references to removed clipPaths)
    {
      name: 'cleanupIds',
      active: true,
      params: {
        remove: true,
        minify: false,
      },
    },
    // Remove viewBox artifacts
    {
      name: 'removeViewBox',
      active: false, // Keep viewBox for proper scaling
    },
    // Simplify paths and shapes
    {
      name: 'convertPathData',
      active: true,
    },
    {
      name: 'convertShapeToPath',
      active: false, // Keep shapes as shapes for better compatibility
    },
    {
      name: 'cleanupNumericValues',
      active: true,
    },
    // Remove unused attributes
    {
      name: 'removeUselessStrokeAndFill',
      active: true,
    },
    {
      name: 'removeUnknownsAndDefaults',
      active: true,
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

