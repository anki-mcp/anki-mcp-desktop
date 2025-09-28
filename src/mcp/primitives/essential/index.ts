// Configuration
export { ANKI_CONFIG } from '../../config/anki-config.interface';
export type { IAnkiConfig } from '../../config/anki-config.interface';

// Types
export * from '../../types/anki.types';

// Utilities
export * from '../../utils/anki.utils';

// Clients
export { AnkiConnectClient, AnkiConnectError } from '../../clients/anki-connect.client';

// Tools
export { EchoTool } from './tools/echo.tool';
export { SyncTool } from './tools/sync.tool';
export { ListDecksTool } from './tools/list-decks.tool';
export { GetDueCardsTool } from './tools/get-due-cards.tool';
export { PresentCardTool } from './tools/present-card.tool';
export { RateCardTool } from './tools/rate-card.tool';

// Prompts
export { ExamplePrompt } from './prompts/example.prompt';
export { ReviewSessionPrompt } from './prompts/review-session.prompt';

// Resources
export { SystemInfoResource } from './resources/system-info.resource';

// Module
import { Module, DynamicModule, Provider, Type } from '@nestjs/common';
import { AnkiConnectClient } from '../../clients/anki-connect.client';
import { EchoTool } from './tools/echo.tool';
import { SyncTool } from './tools/sync.tool';
import { ListDecksTool } from './tools/list-decks.tool';
import { GetDueCardsTool } from './tools/get-due-cards.tool';
import { PresentCardTool } from './tools/present-card.tool';
import { RateCardTool } from './tools/rate-card.tool';
import { ExamplePrompt } from './prompts/example.prompt';
import { ReviewSessionPrompt } from './prompts/review-session.prompt';
import { SystemInfoResource } from './resources/system-info.resource';

const MCP_PRIMITIVES = [
  // Client
  AnkiConnectClient,
  // Tools
  EchoTool,
  SyncTool,
  ListDecksTool,
  GetDueCardsTool,
  PresentCardTool,
  RateCardTool,
  // Prompts
  ExamplePrompt,
  ReviewSessionPrompt,
  // Resources
  SystemInfoResource,
];

export interface McpPrimitivesAnkiEssentialModuleOptions {
  ankiConfigProvider: Provider;
}

@Module({})
export class McpPrimitivesAnkiEssentialModule {
  static forRoot(options: McpPrimitivesAnkiEssentialModuleOptions): DynamicModule {
    return {
      module: McpPrimitivesAnkiEssentialModule,
      providers: [
        options.ankiConfigProvider,
        ...MCP_PRIMITIVES,
      ],
      exports: MCP_PRIMITIVES,
    };
  }
}