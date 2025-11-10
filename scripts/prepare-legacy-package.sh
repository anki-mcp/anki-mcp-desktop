#!/bin/bash
set -e

# This script temporarily modifies package.json for backward compatibility
# with the old anki-mcp-http package name

# Backup original package.json
cp package.json package.json.backup

# Replace package name for legacy publishing
sed -i.bak 's/"name": "@ankimcp\/anki-mcp-server"/"name": "anki-mcp-http"/' package.json

# Replace bin command name back to anki-mcp-http
sed -i.bak 's/"anki-mcp-server": "bin\/ankimcp.js"/"anki-mcp-http": "bin\/ankimcp.js"/' package.json

# Clean up sed backup files
rm -f package.json.bak

echo "Package prepared for legacy publishing as anki-mcp-http"
