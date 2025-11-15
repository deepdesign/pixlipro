/**
 * Extract 5 dominant colors from an image (File or URL)
 * Uses k-means clustering to find representative colors
 */
export async function extractColorsFromImage(
  image: File | string,
): Promise<string[]> {
  // Load image into HTMLImageElement
  const img = await loadImage(image);

  // Create canvas and draw image (resize for performance)
  const canvas = document.createElement("canvas");
  const maxSize = 200; // Resize to max 200px for performance
  const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Get pixel data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  // Extract colors using k-means clustering
  const colors = extractKMeansColors(pixels, 5);

  return colors;
}

/**
 * Load image from File or URL
 */
function loadImage(image: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Try to allow CORS

    img.onload = () => resolve(img);
    img.onerror = (_error) => {
      if (typeof image === "string") {
        reject(
          new Error(
            "Image cannot be loaded due to security restrictions. Please upload the image file instead.",
          ),
        );
      } else {
        reject(new Error("Failed to load image file"));
      }
    };

    if (typeof image === "string") {
      img.src = image;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(image);
    }
  });
}

/**
 * Extract colors using simplified k-means clustering
 * Returns array of 5 hex color strings
 */
function extractKMeansColors(pixels: Uint8ClampedArray, k: number): string[] {
  // Sample pixels (every 4th pixel for performance)
  const samples: number[][] = [];
  for (let i = 0; i < pixels.length; i += 16) {
    // Every 4th pixel (r, g, b, a)
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    // Skip transparent pixels
    if (pixels[i + 3] > 128) {
      samples.push([r, g, b]);
    }
  }

  if (samples.length === 0) {
    // Fallback to default colors if no valid pixels
    return ["#000000", "#ffffff", "#808080", "#ff0000", "#0000ff"];
  }

  // Initialize centroids with random samples
  const centroids: number[][] = [];
  const usedIndices = new Set<number>();
  for (let i = 0; i < k && centroids.length < samples.length; i++) {
    let idx;
    do {
      idx = Math.floor(Math.random() * samples.length);
    } while (usedIndices.has(idx));
    usedIndices.add(idx);
    centroids.push([...samples[idx]]);
  }

  // K-means iteration (simplified, 10 iterations)
  for (let iter = 0; iter < 10; iter++) {
    // Assign samples to nearest centroid
    const clusterSums: number[][] = centroids.map(() => [0, 0, 0]);
    const clusterCounts: number[] = centroids.map(() => 0);

    for (const sample of samples) {
      let minDist = Infinity;
      let nearestCluster = 0;

      for (let i = 0; i < centroids.length; i++) {
        const dist = colorDistance(sample, centroids[i]);
        if (dist < minDist) {
          minDist = dist;
          nearestCluster = i;
        }
      }

      clusterSums[nearestCluster][0] += sample[0];
      clusterSums[nearestCluster][1] += sample[1];
      clusterSums[nearestCluster][2] += sample[2];
      clusterCounts[nearestCluster]++;
    }

    // Update centroids
    for (let i = 0; i < centroids.length; i++) {
      if (clusterCounts[i] > 0) {
        centroids[i][0] = Math.round(clusterSums[i][0] / clusterCounts[i]);
        centroids[i][1] = Math.round(clusterSums[i][1] / clusterCounts[i]);
        centroids[i][2] = Math.round(clusterSums[i][2] / clusterCounts[i]);
      }
    }
  }

  // Convert to hex and ensure distinct colors
  const hexColors = centroids
    .map((rgb) => rgbToHex(rgb[0], rgb[1], rgb[2]))
    .filter((color, index, arr) => {
      // Ensure minimum distance between colors
      for (let i = 0; i < index; i++) {
        if (hexColorDistance(color, arr[i]) < 30) {
          return false; // Too similar to existing color
        }
      }
      return true;
    });

  // If we have fewer than k colors, fill with variations
  while (hexColors.length < k) {
    const baseColor = hexColors[hexColors.length - 1] || "#808080";
    const variation = generateColorVariation(baseColor);
    if (!hexColors.includes(variation)) {
      hexColors.push(variation);
    } else {
      break; // Avoid infinite loop
    }
  }

  return hexColors.slice(0, k);
}

/**
 * Calculate color distance (Euclidean distance in RGB space)
 */
function colorDistance(color1: number[], color2: number[]): number {
  const dr = color1[0] - color2[0];
  const dg = color1[1] - color2[1];
  const db = color1[2] - color2[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Calculate distance between two hex colors
 */
function hexColorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return Infinity;
  return colorDistance([rgb1.r, rgb1.g, rgb1.b], [rgb2.r, rgb2.g, rgb2.b]);
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Generate a color variation
 */
function generateColorVariation(baseHex: string): string {
  const rgb = hexToRgb(baseHex);
  if (!rgb) return "#808080";

  // Shift hue slightly
  const shift = 30;
  const r = Math.max(0, Math.min(255, rgb.r + (Math.random() - 0.5) * shift));
  const g = Math.max(0, Math.min(255, rgb.g + (Math.random() - 0.5) * shift));
  const b = Math.max(0, Math.min(255, rgb.b + (Math.random() - 0.5) * shift));

  return rgbToHex(Math.round(r), Math.round(g), Math.round(b));
}

