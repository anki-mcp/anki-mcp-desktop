import { Injectable } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';

@Injectable()
export class EchoTool {
  @Tool({
    name: 'echo',
    description: 'Simple echo command that returns the provided message',
    parameters: z.object({
      message: z.string().describe('The message to echo back'),
      uppercase: z
        .boolean()
        .default(false)
        .describe('Return message in uppercase'),
    }),
  })
  async echo(
    { message, uppercase }: { message: string; uppercase?: boolean },
    context: Context,
  ) {
    // Report progress
    await context.reportProgress({ progress: 50, total: 100 });

    // Process the message
    const result = uppercase ? message.toUpperCase() : message;

    // Report completion
    await context.reportProgress({ progress: 100, total: 100 });

    return {
      content: [
        {
          type: 'text',
          text: `Echo: ${result}`,
        },
      ],
    };
  }
}
