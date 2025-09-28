import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { AnkiConnectClient } from '../../../clients/anki-connect.client';
import { DeckInfo, DeckStats } from '../../../types/anki.types';
import { createSuccessResponse, createErrorResponse, parseDeckStats } from '../../../utils/anki.utils';

/**
 * Tool for listing all available Anki decks
 */
@Injectable()
export class ListDecksTool {
  private readonly logger = new Logger(ListDecksTool.name);

  constructor(private readonly ankiClient: AnkiConnectClient) {}

  @Tool({
    name: 'list_decks',
    description:
      'List all available Anki decks, optionally with statistics. Remember to sync first at the start of a review session for latest data.',
    parameters: z.object({
      include_stats: z
        .boolean()
        .default(false)
        .describe('Include card count statistics for each deck'),
    }),
  })
  async listDecks(
    { include_stats }: { include_stats?: boolean },
    context: Context,
  ) {
    try {
      const includeStats = include_stats || false;
      this.logger.log(`Listing Anki decks with stats: ${includeStats}`);
      await context.reportProgress({ progress: 10, total: 100 });

      // Get list of deck names
      const deckNames = await this.ankiClient.invoke<string[]>('deckNames');

      if (!deckNames || deckNames.length === 0) {
        this.logger.log('No decks found');
        await context.reportProgress({ progress: 100, total: 100 });
        return createSuccessResponse({
          success: true,
          message: 'No decks found in Anki',
          decks: [],
        });
      }

      await context.reportProgress({ progress: 50, total: 100 });

      let decks: DeckInfo[];
      let summary: Record<string, number> | undefined;

      if (includeStats) {
        // Get deck statistics for all decks
        const deckStats = await this.ankiClient.invoke<Record<string, any>>('deckStats');

        // Transform to our DeckInfo structure
        decks = deckNames.map(name => {
          const stats = deckStats[name];
          if (stats) {
            const parsed = parseDeckStats(stats);
            return {
              name,
              stats: {
                deck_id: stats.deck_id || 0,
                name,
                new_count: parsed.new_count,
                learn_count: parsed.learn_count,
                review_count: parsed.review_count,
                total_new: parsed.new_count,
                total_cards: parsed.total_cards,
              } as DeckStats,
            };
          }
          return { name };
        });

        // Calculate summary totals
        summary = decks.reduce(
          (acc, deck) => {
            if (deck.stats) {
              acc.total_cards += deck.stats.total_cards;
              acc.new_cards += deck.stats.new_count;
              acc.learning_cards += deck.stats.learn_count;
              acc.review_cards += deck.stats.review_count;
            }
            return acc;
          },
          { total_cards: 0, new_cards: 0, learning_cards: 0, review_cards: 0 },
        );
      } else {
        // Just return deck names without stats
        decks = deckNames.map(name => ({ name }));
      }

      await context.reportProgress({ progress: 100, total: 100 });
      this.logger.log(`Found ${decks.length} decks`);

      const response: any = {
        success: true,
        decks,
        total: decks.length,
      };

      if (summary) {
        response.summary = summary;
      }

      return createSuccessResponse(response);
    } catch (error) {
      this.logger.error('Failed to list decks', error);
      return createErrorResponse(error);
    }
  }
}