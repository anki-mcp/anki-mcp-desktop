import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import type { Context } from '@rekog/mcp-nest';
import { z } from 'zod';
import { AnkiConnectClient } from '../../../clients/anki-connect.client';
import { createSuccessResponse, createErrorResponse } from '../../../utils/anki.utils';

/**
 * Tool for creating new Anki decks
 */
@Injectable()
export class CreateDeckTool {
  private readonly logger = new Logger(CreateDeckTool.name);

  constructor(private readonly ankiClient: AnkiConnectClient) {}

  @Tool({
    name: 'create_deck',
    description:
      'Create a new empty Anki deck. Supports parent::child structure (e.g., "Japanese::Tokyo" creates parent deck "Japanese" and child deck "Tokyo"). Maximum 2 levels of nesting allowed. Will not overwrite existing decks. ' +
      'IMPORTANT: This tool ONLY creates an empty deck. DO NOT add cards or notes after creating a deck unless the user EXPLICITLY asks to add them. Wait for user instructions before adding any content.',
    parameters: z.object({
      deck_name: z
        .string()
        .min(1)
        .describe('The name of the deck to create. Use "::" for parent::child structure (max 2 levels)')
        .refine(
          (name) => {
            const parts = name.split('::');
            return parts.length <= 2;
          },
          {
            message: 'Deck name can have maximum 2 levels (parent::child). More than 2 levels not permitted.',
          }
        ),
    }),
  })
  async createDeck(
    { deck_name }: { deck_name: string },
    context: Context,
  ) {
    try {
      // Validate deck name doesn't have more than 2 levels
      const parts = deck_name.split('::');
      if (parts.length > 2) {
        return createErrorResponse(
          new Error('Deck name can have maximum 2 levels (parent::child)'),
          {
            deckName: deck_name,
            levels: parts.length,
            maxLevels: 2
          }
        );
      }

      // Check for empty parts
      if (parts.some(part => part.trim() === '')) {
        return createErrorResponse(
          new Error('Deck name parts cannot be empty'),
          { deckName: deck_name }
        );
      }

      this.logger.log(`Creating deck: ${deck_name}`);
      await context.reportProgress({ progress: 25, total: 100 });

      // Create the deck using AnkiConnect
      const deckId = await this.ankiClient.invoke<number>('createDeck', {
        deck: deck_name
      });

      await context.reportProgress({ progress: 75, total: 100 });

      if (!deckId) {
        this.logger.warn(`Deck may already exist: ${deck_name}`);

        // Check if deck exists by listing all decks
        const existingDecks = await this.ankiClient.invoke<string[]>('deckNames');
        const deckExists = existingDecks.includes(deck_name);

        await context.reportProgress({ progress: 100, total: 100 });

        if (deckExists) {
          return createSuccessResponse({
            success: true,
            message: `Deck "${deck_name}" already exists`,
            deckName: deck_name,
            created: false,
            exists: true,
          });
        }

        return createErrorResponse(
          new Error('Failed to create deck - unknown error'),
          { deckName: deck_name }
        );
      }

      await context.reportProgress({ progress: 100, total: 100 });
      this.logger.log(`Successfully created deck: ${deck_name} with ID: ${deckId}`);

      const response: any = {
        success: true,
        deckId: deckId,
        deckName: deck_name,
        message: `Successfully created deck "${deck_name}"`,
        created: true,
      };

      // If it's a parent::child structure, note both decks were created
      if (parts.length === 2) {
        response.parentDeck = parts[0];
        response.childDeck = parts[1];
        response.message = `Successfully created parent deck "${parts[0]}" and child deck "${parts[1]}"`;
      }

      return createSuccessResponse(response);
    } catch (error) {
      this.logger.error(`Failed to create deck ${deck_name}`, error);

      // Check if it's a duplicate deck error
      if (error instanceof Error && error.message.includes('already exists')) {
        return createSuccessResponse({
          success: true,
          message: `Deck "${deck_name}" already exists`,
          deckName: deck_name,
          created: false,
          exists: true,
        });
      }

      return createErrorResponse(error, {
        deckName: deck_name,
        hint: 'Make sure Anki is running and the deck name is valid'
      });
    }
  }
}