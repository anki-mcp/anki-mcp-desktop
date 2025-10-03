import { Command } from 'commander';

export interface CliOptions {
  port: number;
  host: string;
  ankiConnect: string;
}

export function parseCliArgs(): CliOptions {
  const program = new Command();

  program
    .name('ankimcp')
    .description('AnkiMCP HTTP Server - Model Context Protocol server for Anki')
    .version('0.2.0')
    .option('-p, --port <number>', 'Port to listen on', '3000')
    .option('-h, --host <address>', 'Host to bind to', '127.0.0.1')
    .option(
      '-a, --anki-connect <url>',
      'AnkiConnect URL',
      'http://localhost:8765',
    )
    .addHelpText(
      'after',
      `
Examples:
  $ ankimcp                                    # Use defaults
  $ ankimcp --port 8080                        # Custom port
  $ ankimcp --host 0.0.0.0 --port 3000         # Listen on all interfaces
  $ ankimcp --anki-connect http://localhost:8765

Usage with ngrok:
  1. Start ankimcp in one terminal
  2. In another terminal: ngrok http 3000
  3. Share the ngrok URL with your AI assistant
`,
    );

  program.parse();

  const options = program.opts<CliOptions>();

  return {
    port: parseInt(options.port.toString(), 10),
    host: options.host,
    ankiConnect: options.ankiConnect,
  };
}

export function displayStartupBanner(options: CliOptions): void {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    AnkiMCP HTTP Server                         ║
╚════════════════════════════════════════════════════════════════╝

🚀 Server running on: http://${options.host}:${options.port}
🔌 AnkiConnect URL:   ${options.ankiConnect}

Configuration:
  • Port:               ${options.port} (override: --port 8080)
  • Host:               ${options.host} (override: --host 0.0.0.0)
  • AnkiConnect:        ${options.ankiConnect}
                        (override: --anki-connect http://localhost:8765)

Usage with ngrok:
  1. In another terminal: ngrok http ${options.port}
  2. Share the ngrok URL with your AI assistant

Run 'ankimcp --help' for more options.
`);
}
