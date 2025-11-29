/**
 * Auto-generate sprite collections from public/sprites directory
 * 
 * This script scans public/sprites/ for folders and SVG files,
 * then generates collection definitions automatically.
 * 
 * Run this script before dev/build to ensure collections are up-to-date.
 */

import { readdir, stat } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const spritesDir = join(projectRoot, 'public', 'sprites');
const outputFile = join(projectRoot, 'src', 'constants', 'spriteCollections.generated.ts');

/**
 * Sanitize filename to display name
 * Converts "christmas-tree.svg" -> "Christmas Tree"
 */
function sanitizeSpriteName(filename) {
  // Remove extension
  const name = filename.replace(/\.svg$/i, '');
  // Replace hyphens/underscores with spaces
  const withSpaces = name.replace(/[-_]/g, ' ');
  // Capitalize words
  return withSpaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Generate sprite ID from filename
 * Converts "christmas-tree.svg" -> "christmas-tree"
 * Keeps original filename (with spaces if present) for path matching
 */
function generateSpriteId(filename) {
  return basename(filename, '.svg').toLowerCase().replace(/\s+/g, '-');
}

/**
 * Capitalize collection name for display
 * Converts "christmas" -> "Christmas"
 */
function capitalizeCollectionName(collectionId) {
  return collectionId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Check if a path is a directory
 */
async function isDirectory(path) {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check if a path is a file
 */
async function isFile(path) {
  try {
    const stats = await stat(path);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * Scan sprites directory and generate collections
 */
async function generateCollections() {
  try {
    // Check if sprites directory exists
    if (!(await isDirectory(spritesDir))) {
      console.log('⚠️  Sprites directory not found:', spritesDir);
      console.log('   Creating empty collections file...');
      writeEmptyCollections();
      return;
    }

    // Read all items in sprites directory
    const items = await readdir(spritesDir);
    const collections = [];

    // Process each item (should be a folder)
    for (const item of items) {
      const itemPath = join(spritesDir, item);
      
      // Skip if not a directory
      if (!(await isDirectory(itemPath))) {
        continue;
      }

      // Skip "primitives" folder - it's handled separately
      if (item === 'primitives') {
        continue;
      }

      // Skip "default" folder - it's handled separately in spriteCollections.ts
      if (item === 'default') {
        continue;
      }

      // Read SVG files in this collection folder
      const files = await readdir(itemPath);
      const svgFiles = files.filter(file => 
        extname(file).toLowerCase() === '.svg'
      );

      if (svgFiles.length === 0) {
        console.log(`⚠️  No SVG files found in collection: ${item}`);
        continue;
      }

      // Generate sprite definitions
      const sprites = svgFiles.map(file => {
        const spriteId = generateSpriteId(file);
        const spriteName = sanitizeSpriteName(file);
        // Keep original filename for path (may have spaces)
        const svgPath = `/sprites/${item}/${file}`;

        return {
          id: spriteId,
          name: spriteName,
          svgPath: svgPath,
        };
      });

      // Sort sprites by name for consistent ordering
      sprites.sort((a, b) => a.name.localeCompare(b.name));

      collections.push({
        collectionId: item,
        sprites: sprites,
      });

      console.log(`✅ Found collection "${item}" with ${sprites.length} sprites`);
    }

    // Generate TypeScript file
    generateTypeScriptFile(collections);
    
    console.log(`\n✅ Generated ${collections.length} collections`);
    console.log(`   Output: ${outputFile}`);
  } catch (error) {
    console.error('❌ Error generating collections:', error);
    process.exit(1);
  }
}

/**
 * Generate TypeScript file with collections
 */
function generateTypeScriptFile(collections) {
  const collectionsCode = collections.map(collection => {
    const spritesCode = collection.sprites.map(sprite => {
      return `      { id: "${sprite.id}", name: "${sprite.name}", svgPath: "${sprite.svgPath}" }`;
    }).join(',\n');

    return `  {
    collectionId: "${collection.collectionId}",
    sprites: [
${spritesCode}
    ]
  }`;
  }).join(',\n');

  const fileContent = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * 
 * This file is automatically generated by scripts/generate-sprite-collections.js
 * Run "npm run generate:collections" to regenerate this file.
 * 
 * Last generated: ${new Date().toISOString()}
 */

/**
 * Auto-generated SVG collection definitions
 * Generated from public/sprites/ directory structure
 */
export const autoGeneratedCollections: Array<{
  collectionId: string;
  sprites: Array<{ id: string; name: string; svgPath: string }>;
}> = [
${collectionsCode}
];
`;

  writeFileSync(outputFile, fileContent, 'utf-8');
}

/**
 * Write empty collections file if sprites directory doesn't exist
 */
function writeEmptyCollections() {
  const fileContent = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * 
 * This file is automatically generated by scripts/generate-sprite-collections.js
 * Run "npm run generate:collections" to regenerate this file.
 * 
 * Last generated: ${new Date().toISOString()}
 */

/**
 * Auto-generated SVG collection definitions
 * Generated from public/sprites/ directory structure
 */
export const autoGeneratedCollections: Array<{
  collectionId: string;
  sprites: Array<{ id: string; name: string; svgPath: string }>;
}> = [];
`;

  writeFileSync(outputFile, fileContent, 'utf-8');
}

// Run the generator
generateCollections();

