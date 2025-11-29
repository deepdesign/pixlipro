// Polyfill for Node.js 'os' module for browser compatibility
// Used by SVGO which expects os.EOL to exist

export const EOL = '\n';

export default {
  EOL,
};

