import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';

@Injectable()
export class EchoLocalTool {
  @Tool({
    name: 'echo_local',
    description: 'Echo a message back to the user (local mode)',
    parameters: z.object({
      message: z.string().describe('The message to echo'),
    }),
  })
  async echoLocal(
    { message }: { message: string },
    context: Context,
  ) {
    return {
      content: [
        {
          type: 'text',
          text: `[LOCAL] ${message}`,
        },
      ],
    };
  }
}