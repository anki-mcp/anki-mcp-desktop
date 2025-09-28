import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { AnkiConnectClient } from '../../../clients/anki-connect.client';
import { AnkiCard, CardPresentation } from '../../../types/anki.types';
import { extractCardContent, getCardType, createSuccessResponse, createErrorResponse } from '../../../utils/anki.utils';

/**
 * Tool for retrieving and formatting a single card's data
 */
@Injectable()
export class PresentCardTool {
  private readonly logger = new Logger(PresentCardTool.name);

  constructor(private readonly ankiClient: AnkiConnectClient) {}

  @Tool({
    name: 'present_card',
    description:
      'Retrieve a card\'s content for review. WORKFLOW: 1) Show question, 2) Wait for user answer, 3) Show answer with show_answer=true, 4) Evaluate and suggest rating (1-4), 5) Wait for user confirmation ("ok"/"next" = accept, or they provide different rating), 6) Only then use rate_card',
    parameters: z.object({
      card_id: z
        .number()
        .describe('The ID of the card to retrieve'),
      show_answer: z
        .boolean()
        .default(false)
        .describe('Whether to include the answer/back content in the response'),
    }),
  })
  async presentCard(
    { card_id, show_answer }: { card_id: number; show_answer?: boolean },
    context: Context,
  ) {
    try {
      const showAnswer = show_answer || false;

      this.logger.log(`Retrieving card ${card_id} for presentation (show_answer: ${showAnswer})`);
      await context.reportProgress({ progress: 25, total: 100 });

      // Get detailed card information
      const cardsInfo = await this.ankiClient.invoke<AnkiCard[]>('cardsInfo', {
        cards: [card_id]
      });

      if (!cardsInfo || cardsInfo.length === 0) {
        this.logger.warn(`Card not found: ${card_id}`);
        return createErrorResponse(
          new Error(`Card with ID ${card_id} not found`),
          { cardId: card_id }
        );
      }

      await context.reportProgress({ progress: 75, total: 100 });

      const card = cardsInfo[0];
      const { front, back } = extractCardContent(card.fields);
      const cardType = getCardType(card.type);

      // Build the presentation object
      const presentation: CardPresentation = {
        cardId: card.cardId,
        front: front || card.question || '',
        deckName: card.deckName,
        modelName: card.modelName,
        tags: card.tags || [],
        currentInterval: card.interval || 0,
        easeFactor: card.factor || 2500,
        reviews: card.reps || 0,
        lapses: card.lapses || 0,
        cardType,
        noteId: card.note,
      };

      // Only include answer if requested
      if (showAnswer) {
        presentation.back = back || card.answer || '';
      }

      await context.reportProgress({ progress: 100, total: 100 });
      this.logger.log(`Retrieved card ${card_id} for presentation`);

      const response: any = {
        success: true,
        card: presentation,
      };

      if (!showAnswer) {
        response.instruction = 'Question shown. Wait for user\'s answer, then use show_answer=true';
      } else {
        response.instruction = 'Answer revealed. Evaluate response and suggest rating, then wait for user confirmation';
      }

      return createSuccessResponse(response);
    } catch (error) {
      this.logger.error(`Failed to retrieve card ${card_id}`, error);
      return createErrorResponse(error, { cardId: card_id });
    }
  }
}