// Polyfill for Node.js 'stream' module for browser compatibility
// Used by SVGO/sax which expects stream.Stream to exist
// This is a minimal polyfill that provides just enough for SVGO to work

class Stream {
  constructor() {
    // Minimal Stream implementation for SVGO compatibility
    // SVGO/sax doesn't actually use Stream functionality in browser context
  }
}

// CommonJS export (for require('stream'))
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Stream };
  module.exports.Stream = Stream;
}

// ESM exports (for import)
export { Stream };
export default { Stream };

