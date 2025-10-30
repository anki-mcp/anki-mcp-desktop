#!/usr/bin/env node

// Check if --stdio flag is present
const isStdioMode = process.argv.includes('--stdio');

if (isStdioMode) {
  // STDIO mode - for MCP clients like Cursor, Cline, Zed, etc.
  require('../dist/main-stdio.js');
} else {
  // HTTP mode (default) - for web-based AI assistants
  require('../dist/main-http.js');
}
