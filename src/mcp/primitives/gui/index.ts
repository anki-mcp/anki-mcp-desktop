// Tools
export { EchoLocalTool } from './tools/echo-local.tool';

// Module
import { Module, DynamicModule } from '@nestjs/common';
import { EchoLocalTool } from './tools/echo-local.tool';

const MCP_GUI_PRIMITIVES = [
  EchoLocalTool,
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