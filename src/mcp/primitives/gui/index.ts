// Module
import { Module, DynamicModule } from '@nestjs/common';

const MCP_GUI_PRIMITIVES: any[] = [
  // Currently no GUI-specific primitives
];

@Module({})
export class McpPrimitivesAnkiGuiModule {
  static forRoot(): DynamicModule {
    return {
      module: McpPrimitivesAnkiGuiModule,
      providers: MCP_GUI_PRIMITIVES,
      exports: MCP_GUI_PRIMITIVES,
    };
  }
}