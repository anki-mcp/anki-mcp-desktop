import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { AnkiConnectClient } from '@/mcp/clients/anki-connect.client';
import { getRatingDescription, createSuccessResponse, createErrorResponse } from '@/mcp/utils/anki.utils';

/**
 * Tool for rating a card and updating Anki's scheduling
 */
@Injectable()
export class RateCardTool {
  private readonly logger = new Logger(RateCardTool.name);

  constructor(private readonly ankiClient: AnkiConnectClient) {}

  @Tool({
    name: 'rate_card',
    description:
      'Submit a rating for a card to update Anki\'s spaced repetition scheduling. Use this ONLY after the user confirms or modifies your suggested rating. Do not rate automatically without user input.',
    parameters: z.object({
      card_id: z
        .number()
        .describe('The ID of the card to rate'),
      rating: z
        .number()
        .min(1)
        .max(4)
        .describe('The rating for the card (use the user\'s choice, not your suggestion): 1=Again (failed), 2=Hard, 3=Good, 4=Easy'),
    }),
  })
  async rateCard(
    { card_id, rating }: { card_id: number; rating: number },
    context: Context,
  ) {
    try {
      // Validate rating
      if (!Number.isInteger(rating) || rating < 1 || rating > 4) {
        return createErrorResponse(
          new Error('Invalid rating. Must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy)'),
          { cardId: card_id, attemptedRating: rating }
        );
      }

      this.logger.log(`Rating card ${card_id} with rating ${rating}`);
      await context.reportProgress({ progress: 25, total: 100 });

      // Convert rating to ease for AnkiConnect
      // AnkiConnect's answerCards expects ease values 1-4
      const answers = [{
        cardId: card_id,
        ease: rating
      }];

      // Submit the rating to Anki
      const result = await this.ankiClient.invoke<boolean>('answerCards', { answers });

      const ratingDesc = getRatingDescription(rating);

      this.logger.log(`Card ${card_id} rated as ${ratingDesc}`);
      await context.reportProgress({ progress: 75, total: 100 });

      // Get updated card info after rating
      const cardsInfo = await this.ankiClient.invoke<any[]>('cardsInfo', {
        cards: [card_id]
      });

      let nextReview = null;
      if (cardsInfo && cardsInfo.length > 0) {
        const card = cardsInfo[0];
        nextReview = {
          interval: card.interval || 0,
          due: card.due || 0,
          factor: card.factor || 2500,
        };
      }

      await context.reportProgress({ progress: 100, total: 100 });

      return createSuccessResponse({
        success: true,
        cardId: card_id,
        rating: rating,
        ratingDescription: ratingDesc,
        message: `Card successfully rated as ${ratingDesc}`,
        nextReview,
      });
    } catch (error) {
      this.logger.error(`Failed to rate card ${card_id}`, error);

      return createErrorResponse(error, {
        cardId: card_id,
        attemptedRating: rating,
        hint: 'Make sure Anki is running and the card exists',
      });
    }
  }
}