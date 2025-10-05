import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createPinoLogger, createLoggerService } from './bootstrap';
import { OriginValidationGuard } from './http/guards/origin-validation.guard';
import { parseCliArgs, displayStartupBanner } from './cli';
import updateNotifier from 'update-notifier';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read package.json at runtime to avoid affecting TypeScript rootDir detection
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8'),
);

async function bootstrap() {
  // Check for updates (non-blocking, cached)
  updateNotifier({ pkg: packageJson }).notify();

  const options = parseCliArgs();

  // Set environment variables from CLI options
  process.env.PORT = options.port.toString();
  process.env.HOST = options.host;
  process.env.ANKI_CONNECT_URL = options.ankiConnect;

  // Create logger that writes to stdout (fd 1) for HTTP mode
  const pinoLogger = createPinoLogger(1);
  const loggerService = createLoggerService(pinoLogger);

  // HTTP mode - create NestJS HTTP application
  const app = await NestFactory.create(AppModule.forHttp(), {
    logger: loggerService,
    bufferLogs: true,
  });

  // Apply security guards (required by MCP Streamable HTTP spec)
  app.useGlobalGuards(new OriginValidationGuard());

  await app.listen(options.port, options.host);

  // Show startup information
  displayStartupBanner(options);
}

bootstrap().catch((err) => {
  console.error('Failed to start MCP HTTP server:', err);
  process.exit(1);
});
