import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { AnkiConnectClient } from '../../../clients/anki-connect.client';
import { createSuccessResponse, createErrorResponse } from '../../../utils/anki.utils';

/**
 * Tool for opening the Deck Browser dialog
 */
@Injectable()
export class GuiDeckBrowserTool {
  private readonly logger = new Logger(GuiDeckBrowserTool.name);

  constructor(private readonly ankiClient: AnkiConnectClient) {}

  @Tool({
    name: 'guiDeckBrowser',
    description:
      'Open Anki Deck Browser dialog showing all decks. ' +
      'IMPORTANT: Only use when user explicitly requests opening the deck browser. ' +
      'This tool is for deck management and organization workflows, NOT for review sessions. ' +
      'Use this when user wants to see all decks or manage deck structure.',
    parameters: z.object({}),
  })
  async guiDeckBrowser(_args: {}, context: Context) {
    try {
      this.logger.log('Opening Deck Browser');
      await context.reportProgress({ progress: 50, total: 100 });

      // Call AnkiConnect guiDeckBrowser action
      await this.ankiClient.invoke<null>('guiDeckBrowser');

      await context.reportProgress({ progress: 100, total: 100 });
      this.logger.log('Deck Browser opened');

      return createSuccessResponse({
        success: true,
        message: 'Deck Browser opened successfully',
        hint: 'All decks are now visible in the Anki GUI. User can select a deck to study or manage.',
      });
    } catch (error) {
      this.logger.error('Failed to open Deck Browser', error);

      return createErrorResponse(error, {
        hint: 'Make sure Anki is running and the GUI is visible',
      });
    }
  }
}
