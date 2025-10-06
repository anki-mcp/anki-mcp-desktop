import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { AnkiConnectClient } from '@/mcp/clients/anki-connect.client';
import { createSuccessResponse, createErrorResponse } from '@/mcp/utils/anki.utils';

/**
 * Tool for updating CSS styling of an existing model
 */
@Injectable()
export class UpdateModelStylingTool {
  private readonly logger = new Logger(UpdateModelStylingTool.name);

  constructor(private readonly ankiClient: AnkiConnectClient) {}

  @Tool({
    name: 'updateModelStyling',
    description:
      'Update the CSS styling for an existing note type (model). ' +
      'This changes how cards of this type are rendered in Anki. ' +
      'Useful for adding RTL (Right-to-Left) support, changing fonts, colors, or layout. ' +
      'Changes apply to all cards using this model.',
    parameters: z.object({
      modelName: z
        .string()
        .min(1)
        .describe('Name of the model to update (e.g., "Basic", "Basic RTL")'),
      css: z
        .string()
        .min(1)
        .describe(
          'New CSS styling content. For RTL languages, include "direction: rtl;" in .card class. ' +
          'This will completely replace the existing CSS.',
        ),
    }),
  })
  async updateModelStyling(
    { modelName, css }: { modelName: string; css: string },
    context: Context,
  ) {
    try {
      this.logger.log(`Updating styling for model: ${modelName}`);
      await context.reportProgress({ progress: 10, total: 100 });

      // Get current styling for comparison
      let oldStyling: { css: string } | null = null;
      try {
        oldStyling = await this.ankiClient.invoke<{ css: string }>('modelStyling', {
          modelName,
        });
      } catch (error) {
        // Model might not exist, we'll catch this in the update call
        this.logger.warn(`Could not fetch old styling for ${modelName}`);
      }

      await context.reportProgress({ progress: 40, total: 100 });

      // Update the styling
      await this.ankiClient.invoke('updateModelStyling', {
        model: {
          name: modelName,
          css,
        },
      });

      await context.reportProgress({ progress: 80, total: 100 });

      this.logger.log(`Successfully updated styling for model: ${modelName}`);

      await context.reportProgress({ progress: 100, total: 100 });

      // Analyze CSS for useful info
      const cssLength = css.length;
      const hasRtl = css.includes('direction: rtl') || css.includes('direction:rtl');
      const hasCardClass = css.includes('.card');
      const hasFrontClass = css.includes('.front');
      const hasBackClass = css.includes('.back');
      const hasClozeClass = css.includes('.cloze');

      const response: any = {
        success: true,
        modelName,
        cssLength,
        cssInfo: {
          hasRtlSupport: hasRtl,
          hasCardStyling: hasCardClass,
          hasFrontStyling: hasFrontClass,
          hasBackStyling: hasBackClass,
          hasClozeStyling: hasClozeClass,
        },
        message: `Successfully updated CSS styling for model "${modelName}"`,
      };

      if (oldStyling) {
        response.oldCssLength = oldStyling.css.length;
        response.cssLengthChange = cssLength - oldStyling.css.length;
      }

      return createSuccessResponse(response);
    } catch (error) {
      this.logger.error(`Failed to update styling for model ${modelName}`, error);

      // Check for model not found error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes('not found') ||
        errorMessage.includes('does not exist') ||
        errorMessage.includes('model not found')
      ) {
        return createErrorResponse(error, {
          modelName,
          hint: 'Model not found. Use modelNames tool to see available models.',
        });
      }

      return createErrorResponse(error, {
        modelName,
        hint: 'Make sure Anki is running and the model name is correct.',
      });
    }
  }
}
