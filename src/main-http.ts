import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createPinoLogger, createLoggerService } from './bootstrap';
import { OriginValidationGuard } from './http/guards/origin-validation.guard';

async function bootstrap() {
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

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const host = process.env.HOST || '127.0.0.1'; // Localhost only by default

  await app.listen(port, host);

  pinoLogger.info(`MCP Streamable HTTP server started on http://${host}:${port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start MCP HTTP server:', err);
  process.exit(1);
});
