#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read package.json version
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const version = packageJson.version;

// Read manifest.json
const manifestJsonPath = path.join(__dirname, '../manifest.json');
const manifestJson = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf-8'));

// Update manifest.json version
manifestJson.version = version;

// Write back to manifest.json
fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, 2) + '\n');

console.log(`✓ Synced version ${version} from package.json to manifest.json`);
