# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that enables AI assistants to interact with Anki via the AnkiConnect plugin. Built with NestJS and the `@rekog/mcp-nest` library, it exposes Anki functionality as MCP tools, prompts, and resources.

## Essential Commands

### Development
```bash
npm run build           # Build the project (required before running)
npm run start:dev       # Start with watch mode (auto-rebuild)
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
npm run inspector:stdio            # Run MCP inspector (normal mode)
npm run inspector:debug            # Run MCP inspector with debugger on port 9229
```

After running `inspector:debug`, attach your IDE debugger to port 9229. The server pauses at startup waiting for debugger attachment.

## Architecture

### Core Structure

The application follows a modular NestJS architecture with MCP primitives organized into feature modules:

- **`src/main.ts`** - Application bootstrap with Pino logger configured for stderr
- **`src/app.module.ts`** - Root module importing MCP modules and configuration
- **`src/anki-config.service.ts`** - Configuration service implementing `IAnkiConfig`

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

**`src/mcp/primitives/gui/`** - GUI-specific primitives (currently empty, reserved for future use)

### Supporting Infrastructure

- **`src/mcp/clients/anki-connect.client.ts`** - HTTP client for AnkiConnect API using `ky`
  - Handles request/response formatting, error handling, retries
  - Injectable service used by all tools
- **`src/mcp/types/anki.types.ts`** - TypeScript types for AnkiConnect API
- **`src/mcp/config/anki-config.interface.ts`** - Configuration interface (`IAnkiConfig`, `ANKI_CONFIG` token)
- **`src/mcp/utils/anki.utils.ts`** - Shared utility functions

### Module System

The project uses NestJS dynamic modules with dependency injection:

1. `AppModule` imports `McpModule.forRoot()` with STDIO transport
2. `McpPrimitivesAnkiEssentialModule.forRoot()` receives `ankiConfigProvider`
3. All tools/prompts/resources are registered as providers and auto-discovered by `@rekog/mcp-nest`

### Testing Structure

- **Unit tests**: `src/mcp/primitives/essential/tools/__tests__/*.spec.ts` - Test individual tools
- **Workflow tests**: `test/workflows/*.spec.ts` - Integration tests for multi-tool workflows
- **E2E tests**: `test/*.e2e-spec.ts` - End-to-end application tests
- **Mocks**: `src/mcp/clients/__mocks__/` - Mock implementations for testing

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

Default AnkiConnect URL is `https://anki.anatoly.dev` (see `src/anki-config.service.ts:15`). Override with `ANKI_CONNECT_URL` environment variable.

### Path Aliases

TypeScript path aliases are configured:
- `@/*` → `src/*`
- `@test/*` → `test/*`

These work in both source code and tests via Jest's `moduleNameMapper`.

## Working with This Codebase

### Adding a New MCP Tool

1. Create `src/mcp/primitives/essential/tools/your-tool.tool.ts`
2. Export it from `src/mcp/primitives/essential/index.ts`
3. Add to `MCP_PRIMITIVES` array in the same file
4. Create test file: `src/mcp/primitives/essential/tools/__tests__/your-tool.tool.spec.ts`
5. Run `npm run test:tools` to verify

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

- All logs go to stderr (fd 2) to keep stdout clear for MCP protocol
- Set `LOG_LEVEL=debug` environment variable for verbose logging
- Use `npm run inspector:debug` + IDE debugger for step-through debugging
- MCP Inspector provides a web UI for testing tools interactively