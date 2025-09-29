# Anki MCP Desktop

A Model Context Protocol (MCP) server that enables AI assistants to interact with Anki, the spaced repetition flashcard application.

Transform your Anki experience with natural language interaction - like having a private tutor. The AI assistant doesn't just present questions and answers; it can explain concepts, make the learning process more engaging and human-like, provide context, and adapt to your learning style. It can create and edit notes on the fly, turning your study sessions into dynamic conversations. More features coming soon!

## Available Tools

- `sync` - Sync with AnkiWeb
- `list_decks` - Show available decks
- `createDeck` - Create new decks
- `modelNames` - List note types
- `modelFieldNames` - Get fields for a note type
- `modelStyling` - Get CSS styling for a note type
- `addNote` - Create new notes
- `get_due_cards` - Get cards for review
- `present_card` - Show card for review
- `rate_card` - Rate card performance

## Prerequisites

- [Anki](https://apps.ankiweb.net/) with [AnkiConnect](https://github.com/FooSoft/anki-connect) plugin installed
- Node.js 20+

## Installation

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