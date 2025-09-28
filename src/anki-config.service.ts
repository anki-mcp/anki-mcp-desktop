import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAnkiConfig } from './mcp/config/anki-config.interface';

/**
 * Configuration service implementing IAnkiConfig for the STDIO MCP server
 */
@Injectable()
export class AnkiConfigService implements IAnkiConfig {
  constructor(private configService: ConfigService) {}

  get ankiConnectUrl(): string {
    return this.configService.get<string>(
      'ANKI_CONNECT_URL',
      'https://anki.anatoly.dev',
    );
  }

  get ankiConnectApiVersion(): number {
    const version = this.configService.get<string>(
      'ANKI_CONNECT_API_VERSION',
      '6',
    );
    return parseInt(version, 10);
  }

  get ankiConnectApiKey(): string | undefined {
    return this.configService.get<string>('ANKI_CONNECT_API_KEY');
  }

  get ankiConnectTimeout(): number {
    const timeout = this.configService.get<string>(
      'ANKI_CONNECT_TIMEOUT',
      '5000',
    );
    return parseInt(timeout, 10);
  }
}