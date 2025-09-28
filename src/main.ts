import { NestFactory } from '@nestjs/core';
import { LoggerService } from '@nestjs/common';
import { pino } from 'pino';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create a Pino logger that writes to stderr (file descriptor 2)
  const pinoLogger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        destination: 2, // stderr
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  });

  // Create a NestJS-compatible logger service
  const loggerService: LoggerService = {
    log: (message: any, context?: string) => {
      pinoLogger.info({ context }, message);
    },
    error: (message: any, trace?: string, context?: string) => {
      pinoLogger.error({ context, trace }, message);
    },
    warn: (message: any, context?: string) => {
      pinoLogger.warn({ context }, message);
    },
    debug: (message: any, context?: string) => {
      pinoLogger.debug({ context }, message);
    },
    verbose: (message: any, context?: string) => {
      pinoLogger.trace({ context }, message);
    },
  };

  await NestFactory.createApplicationContext(AppModule, {
    logger: loggerService,
  });

  pinoLogger.info('MCP STDIO server started successfully');

  // For STDIO transport, the MCP module handles the stdio communication
  // The app just needs to stay running

  // Keep the application running
  await new Promise(() => {});
}

bootstrap().catch((err) => {
  // Write error to stderr since we're always logging there now
  console.error('Failed to start MCP STDIO server:', err);
  process.exit(1);
});
