import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';
import updateNotifier from 'update-notifier';

export interface CliOptions {
  port: number;
  host: string;
  ankiConnect: string;
}

function getPackageJson() {
  try {
    return JSON.parse(
      readFileSync(join(__dirname, '../package.json'), 'utf-8'),
    );
  } catch {
    return { version: '0.0.0', name: 'anki-mcp-http' };
  }
}

function getVersion(): string {
  return getPackageJson().version;
}

export function checkForUpdates(): void {
  updateNotifier({ pkg: getPackageJson() }).notify();
}

export function parseCliArgs(): CliOptions {
  const program = new Command();

  program
    .name('ankimcp')
    .description('AnkiMCP HTTP Server - Model Context Protocol server for Anki')
    .version(getVersion())
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
  const version = getVersion();
  const title = `AnkiMCP HTTP Server v${version}`;
  const padding = Math.floor((64 - title.length) / 2);
  const paddedTitle = ' '.repeat(padding) + title + ' '.repeat(64 - padding - title.length);

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║${paddedTitle}║
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
