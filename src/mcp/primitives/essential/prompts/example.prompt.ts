import { Injectable, Scope } from '@nestjs/common';
import { Prompt } from '@rekog/mcp-nest';
import { z } from 'zod';

@Injectable({ scope: Scope.REQUEST })
export class ExamplePrompt {
  @Prompt({
    name: 'code-review',
    description:
      'Generate a code review prompt for a specific file or code snippet',
    parameters: z.object({
      language: z.string().describe('Programming language of the code'),
      codeSnippet: z.string().describe('The code to review'),
      focusAreas: z
        .string()
        .optional()
        .describe(
          'Comma-separated list of areas to focus on (e.g., performance, security, readability)',
        ),
    }),
  })
  getCodeReviewPrompt({
    language,
    codeSnippet,
    focusAreas,
  }: {
    language: string;
    codeSnippet: string;
    focusAreas?: string;
  }) {
    const focusText = focusAreas
      ? `Pay special attention to: ${focusAreas}.`
      : '';

    return {
      description: 'Code review instructions for analyzing code quality',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please review the following ${language} code:

\`\`\`${language}
${codeSnippet}
\`\`\`

Provide a detailed code review covering:
1. Code quality and best practices
2. Potential bugs or issues
3. Performance considerations
4. Security concerns
5. Suggestions for improvement

${focusText}

Please be constructive and provide specific examples where possible.`,
          },
        },
      ],
    };
  }

  @Prompt({
    name: 'debug-assistant',
    description: 'Generate a debugging prompt for troubleshooting issues',
    parameters: z.object({
      errorMessage: z.string().describe('The error message encountered'),
      context: z.string().describe('Context about where the error occurred'),
      stackTrace: z.string().optional().describe('Stack trace if available'),
    }),
  })
  getDebugPrompt({
    errorMessage,
    context,
    stackTrace,
  }: {
    errorMessage: string;
    context: string;
    stackTrace?: string;
  }) {
    const stackTraceSection = stackTrace
      ? `\n\nStack trace:\n\`\`\`\n${stackTrace}\n\`\`\``
      : '';

    return {
      description: 'Debug assistance for troubleshooting errors',
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Help me debug this error:

Error Message: ${errorMessage}

Context: ${context}
${stackTraceSection}

Please help me:
1. Understand what caused this error
2. Identify potential solutions
3. Suggest debugging steps
4. Provide code examples if applicable`,
          },
        },
      ],
    };
  }
}
