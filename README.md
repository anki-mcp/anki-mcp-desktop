# Anki MCP Desktop

**Version: 0.1.0 (Beta)** - This project is in active development. APIs and features may change.

A Model Context Protocol (MCP) server that enables AI assistants to interact with Anki, the spaced repetition flashcard application.

Transform your Anki experience with natural language interaction - like having a private tutor. The AI assistant doesn't just present questions and answers; it can explain concepts, make the learning process more engaging and human-like, provide context, and adapt to your learning style. It can create and edit notes on the fly, turning your study sessions into dynamic conversations. More features coming soon!

## Available Tools

### Review & Study
- `sync` - Sync with AnkiWeb
- `get_due_cards` - Get cards for review
- `present_card` - Show card for review
- `rate_card` - Rate card performance

### Deck Management
- `list_decks` - Show available decks
- `createDeck` - Create new decks

### Note Management
- `addNote` - Create new notes
- `findNotes` - Search for notes using Anki query syntax
- `notesInfo` - Get detailed information about notes (fields, tags, CSS)
- `updateNoteFields` - Update existing note fields (CSS-aware, supports HTML)
- `deleteNotes` - Delete notes and their cards

### Model/Template Management
- `modelNames` - List note types
- `modelFieldNames` - Get fields for a note type
- `modelStyling` - Get CSS styling for a note type

## Prerequisites

- [Anki](https://apps.ankiweb.net/) with [AnkiConnect](https://github.com/FooSoft/anki-connect) plugin installed
- Node.js 20+

## Installation

### Option 1: MCPB Bundle (Recommended - One-Click Install)

The easiest way to install this MCP server is using an MCPB bundle:

1. Download the latest `.mcpb` bundle from the [Releases](https://github.com/anki-mcp-organization/anki-mcp-desktop/releases) page
2. In Claude Desktop, install the extension:
   - **Method 1**: Go to Settings → Extensions, then drag and drop the `.mcpb` file
   - **Method 2**: Go to Settings → Developer → Extensions → Install Extension, then select the `.mcpb` file
3. Configure AnkiConnect URL if needed (defaults to `http://localhost:8765`)
4. Restart Claude Desktop

That's it! The bundle includes everything needed to run the server.

### Option 2: Manual Installation from Source

For development or advanced usage:

```bash
npm install
npm run build
```

## Connect to Claude Desktop

You can configure the server in Claude Desktop by either:
- Going to: Settings → Developer → Edit Config
- Or manually editing the config file

### Configuration

Add the following to your Claude Desktop config:

```json
{
  "mcpServers": {
    "anki-mcp": {
      "command": "node",
      "args": ["/path/to/anki-mcp-desktop/dist/main.js"],
      "env": {
        "ANKI_CONNECT_URL": "http://localhost:8765"
      }
    }
  }
}
```

Replace `/path/to/anki-mcp-desktop` with your actual project path.

### Config File Locations

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

For more details, see the [official MCP documentation](https://modelcontextprotocol.io/docs/develop/connect-local-servers).

## Environment Variables (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `ANKI_CONNECT_URL` | AnkiConnect URL | `http://localhost:8765` |
| `ANKI_CONNECT_API_VERSION` | API version | `6` |
| `ANKI_CONNECT_API_KEY` | API key if configured in AnkiConnect | - |
| `ANKI_CONNECT_TIMEOUT` | Request timeout in ms | `5000` |

## Usage Examples

### Searching and Updating Notes

```
# Search for notes in a specific deck
findNotes(query: "deck:Spanish")

# Get detailed information about notes
notesInfo(notes: [1234567890, 1234567891])

# Update a note's fields (HTML content supported)
updateNoteFields(note: {
  id: 1234567890,
  fields: {
    "Front": "<b>¿Cómo estás?</b>",
    "Back": "How are you?"
  }
})

# Delete notes (requires confirmation)
deleteNotes(notes: [1234567890], confirmDeletion: true)
```

### Anki Query Syntax Examples

The `findNotes` tool supports Anki's powerful query syntax:

- `"deck:DeckName"` - All notes in a specific deck
- `"tag:important"` - Notes with the "important" tag
- `"is:due"` - Cards that are due for review
- `"is:new"` - New cards that haven't been studied
- `"added:7"` - Notes added in the last 7 days
- `"front:hello"` - Notes with "hello" in the front field
- `"flag:1"` - Notes with red flag
- `"prop:due<=2"` - Cards due within 2 days
- `"deck:Spanish tag:verb"` - Spanish deck notes with verb tag (AND)
- `"deck:Spanish OR deck:French"` - Notes from either deck

### Important Notes

#### CSS and HTML Handling
- The `notesInfo` tool returns CSS styling information for proper rendering awareness
- The `updateNoteFields` tool supports HTML content in fields and preserves CSS styling
- Each note model has its own CSS styling - use `modelStyling` to get model-specific CSS

#### Update Warning
⚠️ **IMPORTANT**: When using `updateNoteFields`, do NOT view the note in Anki's browser while updating, or the fields will not update properly. Close the browser or switch to a different note before updating.

#### Deletion Safety
The `deleteNotes` tool requires explicit confirmation (`confirmDeletion: true`) to prevent accidental deletions. Deleting a note removes ALL associated cards permanently.

## Development

### Building an MCPB Bundle

To create a distributable MCPB bundle:

```bash
npm run bundle
```

This command will:
1. Compile the TypeScript project (`npm run build`)
2. Package everything into an `.mcpb` file (`npm run bundle:pack`)

The output file will be named `anki-mcp-desktop-1.0.0.mcpb` (or current version) and can be distributed for one-click installation.

#### What Gets Bundled

The MCPB package includes:
- Compiled JavaScript (`dist/` directory)
- All dependencies (`node_modules/`)
- Package metadata (`package.json`)
- Manifest configuration (`manifest.json`)
- Icon (`icon.png`)

Source files, tests, and development configs are automatically excluded via `.mcpbignore`.

### Logging in Claude Desktop

When running as an MCPB extension in Claude Desktop, logs are written to:

**Log Location**: `~/Library/Logs/Claude/` (macOS)

The logs are split across multiple files:
- **main.log** - General Claude Desktop application logs
- **mcp-server-Anki MCP Server.log** - MCP protocol messages for this extension
- **mcp.log** - Combined MCP logs from all servers

**Note**: The pino logger output (INFO, ERROR, WARN messages from the server code) goes to stderr and appears in the MCP-specific log files. Claude Desktop determines which log file receives which messages, but generally:
- Application startup and MCP protocol communication → MCP-specific log
- Server internal logging (pino) → Both MCP-specific log and sometimes main.log

To view logs in real-time:
```bash
tail -f ~/Library/Logs/Claude/mcp-server-Anki\ MCP\ Server.log
```

### Debugging the MCP Server

You can debug the MCP server using the MCP Inspector and attaching a debugger from your IDE (WebStorm, VS Code, etc.).

#### Step 1: Configure Debug Server in MCP Inspector

The `mcp-inspector-config.json` already includes a debug server configuration:

```json
{
  "mcpServers": {
    "stdio-server-debug": {
      "type": "stdio",
      "command": "node",
      "args": ["--inspect-brk=9229", "dist/main.js"],
      "env": {
        "MCP_SERVER_NAME": "anki-mcp-stdio-debug",
        "MCP_SERVER_VERSION": "1.0.0",
        "LOG_LEVEL": "debug"
      },
      "note": "Anki MCP server with debugging enabled on port 9229"
    }
  }
}
```

#### Step 2: Start the Debug Server

Run the MCP Inspector with the debug server:

```bash
npm run inspector:debug
```

This will start the server with Node.js debugging enabled on port 9229 and pause execution at the first line.

#### Step 3: Attach Debugger from Your IDE

##### WebStorm
1. Go to **Run → Edit Configurations**
2. Add a new **Attach to Node.js/Chrome** configuration
3. Set the port to `9229`
4. Click **Debug** to attach

##### VS Code
1. Open the Debug panel (Ctrl+Shift+D / Cmd+Shift+D)
2. Select **Debug MCP Server (Attach)** configuration
3. Press F5 to attach

#### Step 4: Set Breakpoints and Debug

Once attached, you can:
- Set breakpoints in your TypeScript source files
- Step through code execution
- Inspect variables and call stack
- Use the debug console for evaluating expressions

The debugger will work with source maps, allowing you to debug the original TypeScript code rather than the compiled JavaScript.

### Debugging with Claude Desktop

You can also debug the MCP server while it runs inside Claude Desktop by enabling the Node.js debugger and attaching your IDE.

#### Step 1: Configure Claude Desktop for Debugging

Update your Claude Desktop config to enable debugging:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "anki-mcp": {
      "command": "node",
      "args": [
        "--inspect=9229",
        "/Users/anatoly/Developer/git/anki-mcp-organization/anki-mcp-desktop/dist/main.js"
      ],
      "env": {
        "ANKI_CONNECT_URL": "http://localhost:8765"
      }
    }
  }
}
```

**Key change**: Add `--inspect=9229` before the path to `dist/main.js`

**Debug options**:
- `--inspect=9229` - Start debugger immediately, doesn't block (recommended)
- `--inspect-brk=9229` - Pause execution until debugger attaches (for debugging startup issues)

#### Step 2: Restart Claude Desktop

After saving the config, restart Claude Desktop. The MCP server will now run with debugging enabled on port 9229.

#### Step 3: Attach Debugger from Your IDE

##### WebStorm

1. Go to **Run → Edit Configurations**
2. Click the **+** button and select **Attach to Node.js/Chrome**
3. Configure:
   - **Name**: `Attach to Anki MCP (Claude Desktop)`
   - **Host**: `localhost`
   - **Port**: `9229`
   - **Attach to**: `Node.js < 8` or `Chrome or Node.js > 6.3` (depending on WebStorm version)
4. Click **OK**
5. Click **Debug** (Shift+F9) to attach

##### VS Code

1. Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to Anki MCP (Claude Desktop)",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"],
      "sourceMaps": true,
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

2. Open the Debug panel (Ctrl+Shift+D / Cmd+Shift+D)
3. Select **Attach to Anki MCP (Claude Desktop)**
4. Press F5 to attach

#### Step 4: Debug in Real-Time

Once attached, you can:
- Set breakpoints in your TypeScript source files (e.g., `src/mcp/primitives/essential/tools/create-model.tool.ts`)
- Use Claude Desktop normally - breakpoints will hit when tools are invoked
- Step through code execution
- Inspect variables and call stack
- Use the debug console

**Example**: Set a breakpoint in `create-model.tool.ts` at line 119, then ask Claude to create a new model. The debugger will pause at your breakpoint!

**Note**: The debugger stays attached as long as Claude Desktop is running. You can detach/reattach anytime without restarting Claude Desktop.

### Build Commands

```bash
npm run build         # Build the project (compile TypeScript to JavaScript)
npm run start:dev     # Start with watch mode (auto-rebuild)
npm run type-check    # Run TypeScript type checking
npm run lint          # Run ESLint
npm run bundle        # Build and create MCPB bundle (one-click distribution)
npm run bundle:pack   # Package dist/ and node_modules/ into .mcpb file
```

### Testing Commands

```bash
npm test              # Run all tests
npm run test:unit     # Run unit tests only
npm run test:tools    # Run tool-specific tests
npm run test:workflows # Run workflow integration tests
npm run test:e2e      # Run end-to-end tests
npm run test:cov      # Run tests with coverage report
npm run test:watch    # Run tests in watch mode
npm run test:debug    # Run tests with debugger
npm run test:ci       # Run tests for CI (silent, with coverage)
```

### Test Coverage

The project maintains 70% minimum coverage thresholds for:
- Branches
- Functions
- Lines
- Statements

Coverage reports are generated in the `coverage/` directory.

## Versioning

This project follows [Semantic Versioning](https://semver.org/) with a pre-1.0 development approach:

- **0.x.x** - Beta/Development versions (current phase)
  - **0.1.x** - Bug fixes and patches
  - **0.2.0+** - New features or minor improvements
  - **Breaking changes** are acceptable in 0.x versions

- **1.0.0** - First stable release
  - Will be released when the API is stable and tested
  - Breaking changes will require major version bumps (2.0.0, etc.)

**Current Status**: `0.1.0` - Initial beta release. The project is functional but APIs may change based on feedback and testing.

## Similar Projects

If you're exploring Anki MCP integrations, here are other projects in this space:

### [scorzeth/anki-mcp-server](https://github.com/scorzeth/anki-mcp-server)
- **Status**: Appears to be abandoned (no recent updates)
- Early implementation of Anki MCP integration

### [nailuoGG/anki-mcp-server](https://github.com/nailuoGG/anki-mcp-server)
- **Approach**: Lightweight, single-file implementation
- **Architecture**: Procedural code structure with all tools in one file
- **Good for**: Simple use cases, minimal dependencies

**Why this project (anki-mcp-desktop) differs:**
- **Enterprise-grade architecture**: Built on NestJS with dependency injection
- **Modular design**: Each tool is a separate class with clear separation of concerns
- **Maintainability**: Easy to extend with new features without touching existing code
- **Testing**: Comprehensive test suite with 70% coverage requirement
- **Type safety**: Strict TypeScript with Zod validation
- **Error handling**: Robust error handling with helpful user feedback
- **Production-ready**: Proper logging, progress reporting, and MCPB bundle support
- **Scalability**: Can easily grow from basic tools to complex workflows

**Use case**: If you need a solid foundation for building advanced Anki integrations or plan to extend functionality significantly, this project's architectural approach makes it easier to maintain and scale over time.

## Examples and Tutorials

For comprehensive guides, real-world examples, and step-by-step tutorials on using this MCP server with Claude Desktop, visit:

**[ankimcp.ai](https://ankimcp.ai)** - Complete documentation with practical examples and use cases

## Useful Links

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/docs)
- [AnkiConnect API Documentation](https://git.sr.ht/~foosoft/anki-connect)
- [Claude Desktop Download](https://claude.ai/download)
- [Building Desktop Extensions (Anthropic Blog)](https://www.anthropic.com/engineering/desktop-extensions)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
- [NestJS Documentation](https://docs.nestjs.com)
- [Anki Official Website](https://apps.ankiweb.net/)