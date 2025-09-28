import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import {
  McpPrimitivesAnkiEssentialModule,
  ANKI_CONFIG,
} from './mcp/primitives/essential';
import { McpPrimitivesAnkiGuiModule } from './mcp/primitives/gui';
import { AnkiConfigService } from './anki-config.service';

@Module({
  imports: [
    // Configuration Module
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // MCP Module with STDIO transport
    McpModule.forRoot({
      name: process.env.MCP_SERVER_NAME || 'anki-mcp-desktop',
      version: process.env.MCP_SERVER_VERSION || '1.0.0',
      transport: McpTransportType.STDIO,
    }),

    // Import MCP primitives with config
    McpPrimitivesAnkiEssentialModule.forRoot({
      ankiConfigProvider: {
        provide: ANKI_CONFIG,
        useClass: AnkiConfigService,
      },
    }),

    // Import GUI-only primitives
    McpPrimitivesAnkiGuiModule.forRoot(),
  ],
  providers: [AnkiConfigService],
})
export class AppModule {}
