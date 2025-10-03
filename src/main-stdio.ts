import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createPinoLogger, createLoggerService } from './bootstrap';

async function bootstrap() {
  // Create logger that writes to stderr (fd 2) for STDIO mode
  const pinoLogger = createPinoLogger(2);
  const loggerService = createLoggerService(pinoLogger);

  // STDIO mode - create application context (no HTTP server)
  await NestFactory.createApplicationContext(AppModule.forStdio(), {
    logger: loggerService,
    bufferLogs: true,
  });

  pinoLogger.info('MCP STDIO server started successfully');

  // Keep the application running
  await new Promise(() => {});
}

bootstrap().catch((err) => {
  console.error('Failed to start MCP STDIO server:', err);
  process.exit(1);
});
