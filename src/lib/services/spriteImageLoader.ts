/**
 * SVG Sprite Image Loader and Cache
 * 
 * Handles loading and caching of SVG images for sprite collections.
 * Images are loaded asynchronously and cached to avoid redundant loads.
 * SVGs are automatically optimized using SVGO (like SVGOMG) to remove
 * unnecessary elements, metadata, and frames.
 */

import { optimize, type Config } from 'svgo';
import getBounds from 'svg-path-bounds';

// Image cache: maps SVG path to loaded HTMLImageElement
const imageCache = new Map<string, HTMLImageElement>();
const loadingPromises = new Map<string, Promise<HTMLImageElement>>();

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
 * Process SVG content using SVGO and additional Icons8-specific cleanup
 * This combines SVGO optimization (like SVGOMG) with custom frame removal
 * 
 * @param svgText - Raw SVG text content
 * @returns Processed SVG text optimized and cleaned
 */
async function processSvgContent(svgText: string): Promise<string> {
  // First, use SVGO to optimize and clean the SVG
  // Skip optimization for blob URLs (custom sprites) - they're already processed when uploaded
  let processedSvg: string;
  
  // Check if this is SVG content from a blob URL (custom sprite)
  // Custom sprites are already optimized during upload, so skip SVGO
  // Actually, better approach: just try to optimize and catch errors gracefully
  // The warnings are non-fatal - SVGO will still work, just with warnings
  try {
    // SVGO may try to access Node.js modules in browser - catch and handle gracefully
    const result = optimize(svgText, {
      ...svgoConfig,
      // Disable plugins that might use Node.js features
      js2svg: {
        ...svgoConfig.js2svg,
        eol: 'lf', // Use LF instead of os.EOL
      },
    });
    processedSvg = result.data;
  } catch (error) {
    // If SVGO fails (e.g., due to browser compatibility), use original SVG
    // This is acceptable - the SVG will still work, just not optimized
    if (import.meta.env.DEV) {
      console.warn('SVGO optimization failed, using original SVG:', error);
    }
    processedSvg = svgText;
  }
  
  // Additional Icons8-specific cleanup for edge cases
  // SVGO handles most cases, but we do extra checks for background rectangles
  
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
  
  // Preserve fill-rule for boolean shapes (cutouts)
  // Boolean shapes use fill-rule="evenodd" to create cutouts
  // We need to preserve this for proper rendering on canvas
  // Detect boolean shapes by checking for fill-rule="evenodd"
  // Don't remove fill-rule - we'll use it during canvas rendering
  // Just normalize the attribute format
  processedSvg = processedSvg.replace(/fill-rule[=:]["']?evenodd["']?/gi, 'fill-rule="evenodd"');
  processedSvg = processedSvg.replace(/fill-rule[=:]evenodd/gi, 'fill-rule="evenodd"');
  
  // Convert shape elements (<rect>, <circle>, etc.) to <path> elements
  // This ensures all shapes can be extracted as path data for Path2D rendering
  // This prevents frames/borders from appearing when shapes are rendered as images
  
  // Convert <rect> to <path>
  processedSvg = processedSvg.replace(/<rect([^>]*)\/?>/gi, (match, attrs) => {
    // Extract attributes
    const xMatch = attrs.match(/x=["']?([0-9.-]+)["']?/i);
    const yMatch = attrs.match(/y=["']?([0-9.-]+)["']?/i);
    const widthMatch = attrs.match(/width=["']?([0-9.-]+)["']?/i);
    const heightMatch = attrs.match(/height=["']?([0-9.-]+)["']?/i);
    const rxMatch = attrs.match(/rx=["']?([0-9.-]+)["']?/i);
    const ryMatch = attrs.match(/ry=["']?([0-9.-]+)["']?/i);
    
    if (!widthMatch || !heightMatch) return match; // Invalid rect
    
    const x = xMatch ? parseFloat(xMatch[1]) : 0;
    const y = yMatch ? parseFloat(yMatch[1]) : 0;
    const width = parseFloat(widthMatch[1]);
    const height = parseFloat(heightMatch[1]);
    const rx = rxMatch ? parseFloat(rxMatch[1]) : 0;
    const ry = ryMatch ? parseFloat(ryMatch[1]) : rx || 0;
    
    // Convert rect to path
    let pathData: string;
    if (rx > 0 || ry > 0) {
      // Rounded rectangle
      const r = Math.min(rx, ry, width / 2, height / 2);
      pathData = `M ${x + r} ${y} L ${x + width - r} ${y} Q ${x + width} ${y} ${x + width} ${y + r} L ${x + width} ${y + height - r} Q ${x + width} ${y + height} ${x + width - r} ${y + height} L ${x + r} ${y + height} Q ${x} ${y + height} ${x} ${y + height - r} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
    } else {
      // Regular rectangle
      pathData = `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
    }
    
    return `<path d="${pathData}" fill="#ffffff"/>`;
  });
  
  // Convert <circle> to <path>
  processedSvg = processedSvg.replace(/<circle([^>]*)\/?>/gi, (match, attrs) => {
    // Extract attributes
    const cxMatch = attrs.match(/cx=["']?([0-9.-]+)["']?/i);
    const cyMatch = attrs.match(/cy=["']?([0-9.-]+)["']?/i);
    const rMatch = attrs.match(/r=["']?([0-9.-]+)["']?/i);
    
    if (!rMatch) return match; // Invalid circle
    
    const cx = cxMatch ? parseFloat(cxMatch[1]) : 0;
    const cy = cyMatch ? parseFloat(cyMatch[1]) : 0;
    const r = parseFloat(rMatch[1]);
    
    // Convert circle to path using arc commands
    // Circle path: M cx,cy-r A r,r 0 0,1 cx+r,cy A r,r 0 0,1 cx,cy+r A r,r 0 0,1 cx-r,cy A r,r 0 0,1 cx,cy-r Z
    const pathData = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx + r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${r} ${r} 0 0 1 ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy - r} Z`;
    
    return `<path d="${pathData}" fill="#ffffff"/>`;
  });
  
  // Convert <ellipse> to <path>
  processedSvg = processedSvg.replace(/<ellipse([^>]*)\/?>/gi, (match, attrs) => {
    const cxMatch = attrs.match(/cx=["']?([0-9.-]+)["']?/i);
    const cyMatch = attrs.match(/cy=["']?([0-9.-]+)["']?/i);
    const rxMatch = attrs.match(/rx=["']?([0-9.-]+)["']?/i);
    const ryMatch = attrs.match(/ry=["']?([0-9.-]+)["']?/i);
    
    if (!rxMatch || !ryMatch) return match;
    
    const cx = cxMatch ? parseFloat(cxMatch[1]) : 0;
    const cy = cyMatch ? parseFloat(cyMatch[1]) : 0;
    const rx = parseFloat(rxMatch[1]);
    const ry = parseFloat(ryMatch[1]);
    
    const pathData = `M ${cx} ${cy - ry} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx} ${cy + ry} A ${rx} ${ry} 0 0 1 ${cx - rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx} ${cy - ry} Z`;
    
    return `<path d="${pathData}" fill="#ffffff"/>`;
  });
  
  // Remove the original shape closing tags
  processedSvg = processedSvg.replace(/<\/rect>/gi, '');
  processedSvg = processedSvg.replace(/<\/circle>/gi, '');
  processedSvg = processedSvg.replace(/<\/ellipse>/gi, '');
  
  // Extract path data from all paths and wrap in clean template
  // The viewBox itself (0 0 30 30) creates a transparent "canvas" that might appear as a frame
  // We'll extract just the path data and create a clean SVG without the viewBox padding
  const pathMatches = Array.from(processedSvg.matchAll(/<path[^>]*d=["']([^"']+)["'][^>]*>/gi));
  
  if (pathMatches.length > 0) {
    // Extract all path data
    const pathDataArray: string[] = [];
    
    for (const match of pathMatches) {
      const pathData = match[1];
      if (pathData && pathData.trim().length > 0) {
        pathDataArray.push(pathData);
      }
    }
    
    if (pathDataArray.length > 0) {
      // Extract original viewBox to get dimensions
      const viewBoxMatch = processedSvg.match(/viewBox=["']?([0-9.\s-]+)["']?/i);
      let viewBoxWidth = 24;
      let viewBoxHeight = 24;
      
      if (viewBoxMatch) {
        const viewBoxParts = viewBoxMatch[1].trim().split(/[\s,]+/);
        if (viewBoxParts.length >= 4) {
          viewBoxWidth = parseFloat(viewBoxParts[2]) || 24;
          viewBoxHeight = parseFloat(viewBoxParts[3]) || 24;
        }
      }
      
      // Filter out paths that form a frame/rectangle matching the viewBox
      // These are background frames that we don't want to include in bounds
      // Be more aggressive - filter out any path that is >= 90% of viewBox size and at/near origin
      const contentPaths = pathDataArray.filter((pathData) => {
        try {
          // Calculate bounds for this path to check if it's a frame
          const [left, top, right, bottom] = getBounds(pathData);
          
          if (!isFinite(left) || !isFinite(top) || !isFinite(right) || !isFinite(bottom)) {
            return true; // Keep paths with invalid bounds
          }
          
          const width = right - left;
          const height = bottom - top;
          const tolerance = 1.0; // More tolerance for floating point
          const sizeThreshold = 0.9; // Path must be at least 90% of viewBox to be considered a frame
          
          // Check if this path is a large rectangle that could be a frame
          // More lenient: check if it's >= 90% of viewBox size and at/near origin
          const isLargeWidth = width >= viewBoxWidth * sizeThreshold;
          const isLargeHeight = height >= viewBoxHeight * sizeThreshold;
          const isNearOrigin = Math.abs(left) < tolerance && Math.abs(top) < tolerance;
          
          // Also check if width and height are very close (square-ish)
          const isSquareish = Math.abs(width - height) < Math.max(width, height) * 0.1;
          
          // Filter out paths that are large rectangles at origin (likely frames)
          const looksLikeFrame = isLargeWidth && isLargeHeight && isNearOrigin && isSquareish;
          
          return !looksLikeFrame;
        } catch (error) {
          // If bounds calculation fails, keep the path (better to include than exclude)
          return true;
        }
      });
      
      // Calculate actual bounds of content paths only (excluding frames)
      // This handles all SVG path commands (curves, arcs, relative/absolute, etc.)
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let hasBounds = false;
      
      // Calculate bounds for each content path and combine them
      for (const pathData of contentPaths) {
        try {
          // getBounds returns [left, top, right, bottom]
          // Note: Some complex paths (with arcs) may fail - that's okay, we'll use viewBox fallback
          const bounds = getBounds(pathData);
          if (Array.isArray(bounds) && bounds.length >= 4) {
            const [left, top, right, bottom] = bounds;
            
            if (isFinite(left) && isFinite(top) && isFinite(right) && isFinite(bottom)) {
              minX = Math.min(minX, left);
              minY = Math.min(minY, top);
              maxX = Math.max(maxX, right);
              maxY = Math.max(maxY, bottom);
              hasBounds = true;
            }
          }
        } catch (error) {
          // If bounds calculation fails for a path (e.g., arcToCurve issue), skip it
          // This is non-critical - we'll fall back to viewBox dimensions
          if (import.meta.env.DEV) {
            console.warn('Failed to calculate bounds for path (will use viewBox):', error);
          }
        }
      }
      
      // Create clean template: preserve multiple paths properly or combine them correctly
      // When combining multiple paths, we need to ensure each path is properly separated
      // Option 1: Keep them as separate <path> elements (better for complex shapes)
      // Option 2: Combine into single path (simpler but requires proper move commands)
      
      // For now, keep separate paths for better compatibility
      // This avoids issues with path joining that can cause visual defects
      const pathsToUse = contentPaths.length > 0 ? contentPaths : pathDataArray;
      
      // Build path elements - keep each path separate to avoid defects
      const pathElements = pathsToUse.map(pathData => 
        `<path d="${pathData}" fill="#ffffff"/>`
      ).join('');
      
      // Use calculated bounds if available, otherwise use a reasonable default
      if (hasBounds && isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
        // Add small padding (2% of content size) to avoid edge clipping
        const width = maxX - minX;
        const height = maxY - minY;
        const padding = Math.max(width, height) * 0.02;
        
        const tightX = minX - padding;
        const tightY = minY - padding;
        const tightWidth = width + (padding * 2);
        const tightHeight = height + (padding * 2);
        
        // Create tight viewBox that exactly matches the path bounds
        // Use preserveAspectRatio="none" to prevent square aspect ratio enforcement
        // Add explicit width/height that match the viewBox to prevent square rasterization
        const tightViewBox = `${tightX} ${tightY} ${tightWidth} ${tightHeight}`;
        processedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${tightViewBox}" width="${tightWidth}" height="${tightHeight}" preserveAspectRatio="none">${pathElements}</svg>`;
      } else {
        // Fallback: if we can't calculate bounds, use original viewBox reduced by 10%
        const reduceFactor = 0.1;
        const newX = (viewBoxWidth * reduceFactor) / 2;
        const newY = (viewBoxHeight * reduceFactor) / 2;
        const newWidth = viewBoxWidth * (1 - reduceFactor);
        const newHeight = viewBoxHeight * (1 - reduceFactor);
        const fallbackViewBox = `${newX} ${newY} ${newWidth} ${newHeight}`;
        processedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${fallbackViewBox}" width="${newWidth}" height="${newHeight}" preserveAspectRatio="none">${pathElements}</svg>`;
      }
    }
  }
  
  return processedSvg;
}

/**
 * Add cache-busting query parameter in development mode
 * This ensures SVG updates are immediately reflected without manual cache clearing
 */
function addCacheBusting(svgPath: string): string {
  if (import.meta.env.DEV) {
    // Don't add cache-busting to blob URLs - they don't support query parameters
    if (svgPath.startsWith('blob:')) {
      return svgPath;
    }
    // Add timestamp to force reload in development
    const separator = svgPath.includes('?') ? '&' : '?';
    return `${svgPath}${separator}_t=${Date.now()}`;
  }
  return svgPath;
}

/**
 * Load an SVG image from a path
 * Images are cached after first load for better performance
 * SVGs are processed to remove background rectangles/frames
 * 
 * In development mode, caching is disabled and cache-busting is enabled
 * to ensure SVG file updates are immediately reflected.
 * 
 * @param svgPath - Path to the SVG file (e.g., "/sprites/christmas/snowflake.svg")
 * @returns Promise that resolves to the loaded HTMLImageElement
 */
export async function loadSpriteImage(svgPath: string): Promise<HTMLImageElement> {
  // In development mode, bypass cache entirely for immediate updates
  if (!import.meta.env.DEV) {
    // Check cache first (production mode)
  if (imageCache.has(svgPath)) {
    const cached = imageCache.get(svgPath);
    if (cached) {
      return cached;
    }
  }
  }
  
  // Add cache-busting query parameter in development
  const fetchPath = import.meta.env.DEV ? addCacheBusting(svgPath) : svgPath;

  // Check if already loading (only in production to avoid race conditions)
  if (loadingPromises.has(svgPath) && !import.meta.env.DEV) {
    return loadingPromises.get(svgPath)!;
  }
  
  // In development, clear any existing loading promise to force fresh load
  if (import.meta.env.DEV && loadingPromises.has(svgPath)) {
    loadingPromises.delete(svgPath);
  }

  // Start loading
  const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
    // Fetch and process SVG to remove frames (use cache-busted path in dev)
    fetch(fetchPath)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch SVG: ${response.statusText}`);
        }
        return response.text();
      })
      .then(async svgText => {
        // Skip SVGO optimization for blob URLs (custom sprites) - they're already optimized
        // This avoids the os.EOL warnings for custom sprites
        const isBlobUrl = svgPath.startsWith('blob:');
        let processedSvg: string;
        
        if (isBlobUrl) {
          // Custom sprites are already optimized during upload, skip SVGO to avoid warnings
          processedSvg = svgText;
        } else {
          // Process SVG using SVGO (like SVGOMG) + Icons8-specific cleanup
          processedSvg = await processSvgContent(svgText);
        }
        
        // Ensure SVG fill is white for proper tinting during rendering
        // Replace any fill colors with white so multiply compositing works correctly
        processedSvg = processedSvg.replace(/fill="[^"]*"/gi, 'fill="#ffffff"');
        processedSvg = processedSvg.replace(/fill:[^;"]+/gi, 'fill:#ffffff');
        
        // Debug: Log the processed SVG to verify viewBox and paths
        if (import.meta.env.DEV && svgPath.includes('christmas')) {
          console.log(`Processed SVG for ${svgPath}:`, processedSvg);
        }
        
        // Extract viewBox dimensions BEFORE creating the image
        // We'll use these to explicitly set image dimensions
        const viewBoxMatch = processedSvg.match(/viewBox=["']?([0-9.\s-]+)["']?/i);
        let svgAspectRatio: number | undefined;
        let svgViewBox: { width: number; height: number } | undefined;
        
        if (viewBoxMatch) {
          const viewBoxParts = viewBoxMatch[1].trim().split(/[\s,]+/);
          if (viewBoxParts.length >= 4) {
            const vbWidth = parseFloat(viewBoxParts[2]);
            const vbHeight = parseFloat(viewBoxParts[3]);
            svgAspectRatio = vbWidth / vbHeight;
            svgViewBox = { width: vbWidth, height: vbHeight };
          }
        }
        
        // Create blob URL from processed SVG
        const blob = new Blob([processedSvg], { type: 'image/svg+xml' });
        const blobUrl = URL.createObjectURL(blob);
        
        const img = new Image();
        
        // Explicitly set width and height on the Image element BEFORE loading
        // This helps the browser understand the intended aspect ratio
        if (svgViewBox) {
          // Set a reasonable size that preserves aspect ratio
          // Use a base size (e.g., 100px) and scale the other dimension
          const baseSize = 100;
          if (svgAspectRatio && svgAspectRatio > 1) {
            img.width = baseSize;
            img.height = baseSize / svgAspectRatio;
          } else if (svgAspectRatio) {
            img.width = baseSize * svgAspectRatio;
            img.height = baseSize;
          }
        }
        
        img.onload = () => {
            // Store aspect ratio, viewBox, and path data for use in rendering
            if (svgAspectRatio !== undefined) {
              (img as any).__svgAspectRatio = svgAspectRatio;
              (img as any).__svgViewBox = svgViewBox;
              // Extract ALL path data from processed SVG for direct canvas rendering
              // Check if this SVG uses fill-rule="evenodd" for boolean shapes
              const hasEvenOddFill = processedSvg.includes('fill-rule="evenodd"');
              (img as any).__svgHasEvenOddFill = hasEvenOddFill;
              
              // Extract all paths with their full attributes
              const pathMatches = Array.from(processedSvg.matchAll(/<path[^>]*>/gi));
              const paths: Array<{ d: string; fillRule?: string }> = [];
              
              for (const match of pathMatches) {
                const pathElement = match[0];
                const dMatch = pathElement.match(/d=["']([^"']+)["']/i);
                if (dMatch) {
                  const pathData = dMatch[1];
                  const fillRuleMatch = pathElement.match(/fill-rule=["']([^"']+)["']/i);
                  paths.push({
                    d: pathData,
                    fillRule: fillRuleMatch ? fillRuleMatch[1] : undefined,
                  });
                }
              }
              
              if (paths.length > 0) {
                // Store all paths (not just the first one)
                (img as any).__svgPaths = paths;
                // For backward compatibility, also store the first path
                (img as any).__svgPathData = paths[0].d;
                // Store all path data strings for combining
                (img as any).__svgAllPaths = paths.map(p => p.d);
              }
              // Also store the processed SVG string for debugging
              (img as any).__svgString = processedSvg;
            }
          
          // Cache the loaded image
          imageCache.set(svgPath, img);
          loadingPromises.delete(svgPath);
          // Clean up the blob URL
          URL.revokeObjectURL(blobUrl);
          resolve(img);
        };
        
        img.onerror = (error) => {
          loadingPromises.delete(svgPath);
          URL.revokeObjectURL(blobUrl);
          reject(new Error(`Failed to load sprite image: ${svgPath} - ${String(error)}`));
        };

        img.src = blobUrl;
      })
      .catch(error => {
        loadingPromises.delete(svgPath);
        reject(error);
      });
  });

  loadingPromises.set(svgPath, loadPromise);
  return loadPromise;
}

/**
 * Preload multiple sprite images
 * Useful for loading all sprites in a collection upfront
 * 
 * @param svgPaths - Array of SVG paths to preload
 * @returns Promise that resolves when all images are loaded (or failed)
 */
export async function preloadSpriteImages(
  svgPaths: string[]
): Promise<void> {
  const loadPromises = svgPaths.map(path => 
    loadSpriteImage(path).catch(error => {
      console.warn(`Failed to preload sprite: ${path}`, error);
      return null;
    })
  );
  
  await Promise.all(loadPromises);
}

/**
 * Clear the image cache
 * Useful for memory management or when sprites are updated
 */
export function clearSpriteImageCache(): void {
  imageCache.clear();
  loadingPromises.clear();
}

/**
 * Get a cached image (synchronously)
 * Returns undefined if image hasn't been loaded yet
 * 
 * @param svgPath - Path to the SVG file
 * @returns Cached HTMLImageElement or undefined
 */
export function getCachedSpriteImage(svgPath: string): HTMLImageElement | undefined {
  return imageCache.get(svgPath);
}

