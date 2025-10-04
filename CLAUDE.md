# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that enables AI assistants to interact with Anki via the AnkiConnect plugin. Built with NestJS and the `@rekog/mcp-nest` library, it exposes Anki functionality as MCP tools, prompts, and resources.

**Version**: 0.3.0 (Beta) - This project is in active development. Breaking changes may occur in 0.x versions.

**Important**: Check `.claude-draft/` directory for analysis documents, implementation plans, test plans, and project summaries created during development planning sessions.

## Essential Commands

### Development
```bash
# Building
npm run build           # Build project → dist/ (includes both entry points)

# Development servers
npm run start:dev:stdio # STDIO mode with watch (auto-rebuild)
npm run start:dev:http  # HTTP mode with watch (auto-rebuild)

# Production
npm run start:prod:stdio   # Run STDIO mode: node dist/main-stdio.js
npm run start:prod:http    # Run HTTP mode: node dist/main-http.js

# Code quality
npm run type-check      # Run TypeScript type checking without emitting
npm run lint            # Run ESLint with auto-fix
npm run format          # Format code with Prettier
```

### Testing
```bash
npm test                           # Run all tests
npm run test:unit                  # Unit tests only (*.spec.ts files)
npm run test:tools                 # Tool-specific tests
npm run test:workflows             # Workflow integration tests in test/workflows
npm run test:cov                   # Tests with coverage report
npm run test:watch                 # Tests in watch mode
npm run test:debug                 # Tests with Node debugger
npm run test:ci                    # CI mode: silent with coverage
npm run test:single                # Example: run single test file (modify path in script)
```

Test coverage thresholds are enforced at 70% for branches, functions, lines, and statements.

### Debugging
```bash
npm run inspector:stdio            # Run MCP inspector for STDIO mode
npm run inspector:stdio:debug      # Run STDIO inspector with debugger on port 9229
npm run inspector:http             # Run MCP inspector for HTTP mode
```

After running `inspector:stdio:debug`, attach your IDE debugger to port 9229. The server pauses at startup waiting for debugger attachment.

## Architecture

### Core Structure

The application follows a modular NestJS architecture with MCP primitives organized into feature modules:

- **`src/main-stdio.ts`** - STDIO mode entry point
- **`src/main-http.ts`** - HTTP mode entry point
- **`src/cli.ts`** - CLI argument parsing with commander (used by main-http.ts and bin/ankimcp.js)
- **`src/bootstrap.ts`** - Shared utilities for logger creation
- **`src/app.module.ts`** - Root module with forStdio() and forHttp() factory methods
- **`src/anki-config.service.ts`** - Configuration service implementing `IAnkiConfig`
- **`src/http/guards/origin-validation.guard.ts`** - Origin validation for HTTP mode security
- **`bin/ankimcp.js`** - CLI wrapper that invokes main-http.js (used by npm global install)

### Transport Modes

The server supports two MCP transport modes via **separate entry points**:

**STDIO Mode**:
- Entry point: `dist/main-stdio.js`
- For local MCP clients (Claude Desktop, MCP Inspector)
- Standard input/output communication
- Logger writes to stderr (fd 2)
- Run: `npm run start:prod:stdio` or `node dist/main-stdio.js`

**HTTP Mode (Streamable HTTP)**:
- Entry point: `dist/main-http.js`
- For remote MCP clients, web-based integrations
- Uses MCP Streamable HTTP protocol (SSE is deprecated)
- Logger writes to stdout (fd 1)
- Default: `http://127.0.0.1:3000` (localhost-only)
- MCP endpoint at root: `http://127.0.0.1:3000/`
- Run: `npm run start:prod:http` or `node dist/main-http.js`
- CLI options: `--port`, `--host`, `--anki-connect` (parsed by `src/cli.ts` using commander)

**Key Implementation Details**:
- Both entry points compile together in single build (`npm run build`)
- Each has its own bootstrap logic:
  - `src/main-stdio.ts`: `NestFactory.createApplicationContext()` + AppModule.forStdio()
  - `src/main-http.ts`: `NestFactory.create()` + AppModule.forHttp() + guards
- Shared utilities in `src/bootstrap.ts` (logger creation)
- HTTP mode uses `mcpEndpoint: '/'` to mount MCP at root path

**Security (HTTP Mode)**:
- Origin header validation via `OriginValidationGuard` (prevents DNS rebinding)
- Binds to 127.0.0.1 by default (localhost-only)
- No authentication (OAuth support planned for future)

### MCP Primitives Organization

MCP primitives (tools, prompts, resources) are organized in feature modules:

**`src/mcp/primitives/essential/`** - Core Anki functionality
- **Tools**: `src/mcp/primitives/essential/tools/*.tool.ts` - MCP tools for Anki operations
  - Review: `sync`, `get-due-cards`, `present-card`, `rate-card`
  - Decks: `list-decks`, `create-deck`
  - Notes: `add-note`, `find-notes`, `notes-info`, `update-note-fields`, `delete-notes`
  - Models: `model-names`, `model-field-names`, `model-styling`
- **Prompts**: `src/mcp/primitives/essential/prompts/*.prompt.ts` - MCP prompts (e.g., `review-session`)
- **Resources**: `src/mcp/primitives/essential/resources/*.resource.ts` - MCP resources (e.g., `system-info`)
- **`index.ts`** - Module definition with `McpPrimitivesAnkiEssentialModule.forRoot()`

**`src/mcp/primitives/gui/`** - GUI-specific primitives for Anki interface operations
- **Tools**: `src/mcp/primitives/gui/tools/*.tool.ts` - MCP tools for GUI operations
  - Browser: `gui-browse`, `gui-select-card`, `gui-selected-notes`
  - Dialogs: `gui-add-cards`, `gui-edit-note`, `gui-deck-overview`, `gui-deck-browser`
  - Utilities: `gui-current-card`, `gui-show-question`, `gui-show-answer`, `gui-undo`
- **`index.ts`** - Module definition with `McpPrimitivesAnkiGuiModule.forRoot()`
- **IMPORTANT**: GUI tools require explicit user approval - they are for note editing/creation workflows only, NOT for review sessions

### Supporting Infrastructure

- **`src/mcp/clients/anki-connect.client.ts`** - HTTP client for AnkiConnect API using `ky`
  - Handles request/response formatting, error handling, retries
  - Injectable service used by all tools
- **`src/mcp/types/anki.types.ts`** - TypeScript types for AnkiConnect API
- **`src/mcp/config/anki-config.interface.ts`** - Configuration interface (`IAnkiConfig`, `ANKI_CONFIG` token)
- **`src/mcp/utils/anki.utils.ts`** - Shared utility functions

### Module System

The project uses NestJS dynamic modules with dependency injection:

1. `AppModule` imports `McpModule.forRoot()` with transport mode
2. `McpPrimitivesAnkiEssentialModule.forRoot()` and `McpPrimitivesAnkiGuiModule.forRoot()` receive `ankiConfigProvider`
3. All tools/prompts/resources are registered as providers and auto-discovered by `@rekog/mcp-nest`

### Testing Structure

- **Unit tests**:
  - `src/mcp/primitives/essential/tools/__tests__/*.spec.ts` - Test essential tools
  - `src/mcp/primitives/gui/tools/__tests__/*.spec.ts` - Test GUI tools
- **Workflow tests**: `test/workflows/*.spec.ts` - Integration tests for multi-tool workflows
- **E2E tests**: `test/*.e2e-spec.ts` - End-to-end application tests
- **Mocks**: `src/mcp/clients/__mocks__/` - Mock implementations for testing
- **Test helpers**: `src/test-fixtures/test-helpers.ts` - Shared utilities like `parseToolResult()` and `createMockContext()`

## Key Implementation Details

### AnkiConnect Communication

All Anki operations go through `AnkiConnectClient`:
- Uses `ky` HTTP client with retry logic (2 retries, exponential backoff)
- Formats requests with `action`, `version`, `key`, and `params`
- Throws `AnkiConnectError` on API errors with action context
- Configured via environment variables (see README.md)

### MCP Tool Pattern

Each tool follows this structure:
1. Extends base tool class from `@rekog/mcp-nest`
2. Defines Zod schema for input validation
3. Implements `execute()` method that calls `AnkiConnectClient`
4. Returns strongly-typed results

Example: `src/mcp/primitives/essential/tools/sync.tool.ts`

### Environment Configuration

Default AnkiConnect URL is `http://localhost:8765` (see `src/anki-config.service.ts:16`). Override with `ANKI_CONNECT_URL` environment variable.

### Path Aliases

TypeScript path aliases are configured:
- `@/*` → `src/*`
- `@test/*` → `test/*`

These work in both source code and tests via Jest's `moduleNameMapper`.

## Working with This Codebase

### Adding a New MCP Tool

**Essential Tools** (general Anki operations):
1. Create `src/mcp/primitives/essential/tools/your-tool.tool.ts`
2. Export it from `src/mcp/primitives/essential/index.ts`
3. Add to `MCP_PRIMITIVES` array in the same file
4. **Update `manifest.json`** - Add the new tool to the `tools` array (don't forget this!)
5. Create test file: `src/mcp/primitives/essential/tools/__tests__/your-tool.tool.spec.ts`
6. Run `npm run test:tools` to verify

**GUI Tools** (Anki interface operations):
1. Create `src/mcp/primitives/gui/tools/your-gui-tool.tool.ts`
2. Export it from `src/mcp/primitives/gui/index.ts`
3. Add to `MCP_PRIMITIVES` array in the same file
4. **Update `manifest.json`** - Add the new tool to the `tools` array (don't forget this!)
5. Add dual warnings in tool description:
   - "IMPORTANT: Only use when user explicitly requests..."
   - "This tool is for note editing/creation workflows, NOT for review sessions"
6. Create test file: `src/mcp/primitives/gui/tools/__tests__/your-gui-tool.tool.spec.ts`
7. Run `npm run test:tools` to verify

### Adding a New MCP Prompt

1. Create `src/mcp/primitives/essential/prompts/your-prompt.prompt.ts`
2. Follow the same export/registration pattern as tools
3. Prompts define reusable conversation starters for AI assistants

### Testing Best Practices

- Mock `AnkiConnectClient` in unit tests (see existing test files for examples)
- Use workflow tests for multi-step scenarios
- Run `npm run test:cov` to check coverage before committing
- Use `npm run test:watch` during development

### Debugging Tips

- **STDIO mode**: Logs go to stderr (fd 2) to keep stdout clear for MCP protocol
- **HTTP mode**: Logs go to stdout (fd 1) for standard HTTP logging
- Set `LOG_LEVEL=debug` environment variable for verbose logging
- Use `npm run inspector:stdio:debug` + IDE debugger for step-through debugging
- MCP Inspector provides a web UI for testing tools interactively

### NPM Package Testing (Local)

Test the npm package locally before publishing:

```bash
npm run pack:local         # Builds and creates anki-mcp-http-*.tgz
npm run install:local      # Installs from ./anki-mcp-http-*.tgz
ankimcp                    # Test the global command
npm run uninstall:local    # Removes global installation
```

This simulates the full user experience of installing via `npm install -g ankimcp` by creating and installing from a local `.tgz` package.

### MCPB Bundle Distribution

The project can be packaged as an MCPB (Model Context Protocol Bundle) for one-click installation:

```bash
npm run mcpb:bundle           # Sync version, build, and package into .mcpb file
npm run mcpb:clean            # Remove old .mcpb files
npm run sync-version          # Sync version from package.json to manifest.json
```

**Key Points**:
- `mcpb:bundle` automatically syncs version from `package.json` to `manifest.json` before building
- MCPB bundles use **STDIO entry point** (`manifest.json` → `dist/main-stdio.js`)
- User config keys in `manifest.json` **must use snake_case** (e.g., `anki_connect_url`), not camelCase
- MCPB variable substitution syntax: `${user_config.key_name}`
- The `.mcpbignore` file uses patterns like `/src/` (with leading slash) to exclude only root-level directories, not node_modules subdirectories
- Bundle includes: `dist/` (both entry points), `node_modules/`, `package.json`, `manifest.json`, `icon.png`
- Excluded: source files, tests, development configs

### Versioning Convention

This project follows [Semantic Versioning](https://semver.org/):

- **0.x.x** - Pre-1.0 development/beta (current)
  - `0.1.x` - Bug fixes
  - `0.2.0+` - New features
  - Breaking changes allowed
- **1.0.0** - First stable release (when API is stable)
- **x.0.0** - Major versions (breaking changes after 1.0)

### Release Process

**IMPORTANT**: When creating a new release, follow this checklist:

1. ✅ Update version in `package.json` (single source of truth)
2. ✅ **Add new tools to `manifest.json` tools array** ← DON'T FORGET!
3. ✅ Commit changes
4. ✅ Create and push git tag: `git tag -a v0.x.0 -m "Release message"`
5. ✅ Push tag: `git push origin v0.x.0`
6. ✅ GitHub Actions automatically:
   - Syncs version from `package.json` to `manifest.json`
   - Builds the project
   - Runs `npm run mcpb:bundle`
   - Creates GitHub Release
   - Attaches `.mcpb` file

**Note**: Version is now managed only in `package.json`. The `mcpb:bundle` script automatically syncs it to `manifest.json`.

**DO NOT run `npm run mcpb:bundle` manually** - GitHub Actions handles it automatically when you push a tag.

**Manifest Update Template** (only for new tools):
```json
{
  "tools": [
    // ... existing tools ...
    {
      "name": "newTool",
      "description": "What it does"
    }
  ]
}
```