/**
 * Anki-related TypeScript type definitions
 */

/**
 * Card type enumeration (matches Anki's internal type numbers)
 */
export enum CardType {
  New = 0,
  Learning = 1,
  Review = 2,
  Relearning = 3
}

/**
 * AnkiConnect card information structure
 */
export interface AnkiCard {
  cardId: number;
  fields: Record<string, { value: string; order: number }>;
  fieldOrder: number;
  question: string;
  answer: string;
  modelName: string;
  ord: number;
  deckName: string;
  css: string;
  factor?: number;
  interval?: number;
  note: number;
  type: number;
  queue: number;
  due?: number;
  reps?: number;
  lapses?: number;
  left?: number;
  mod?: number;
  flags?: number;
  tags?: string[];
}

/**
 * Simplified card structure for MCP responses
 */
export interface SimplifiedCard {
  cardId: number;
  front: string;
  back: string;
  deckName: string;
  modelName: string;
  due: number;
  interval: number;
  factor: number;
}

/**
 * Card presentation structure with optional answer visibility
 */
export interface CardPresentation {
  cardId: number;
  front: string;
  back?: string; // Only included when showing answer
  deckName: string;
  modelName: string;
  tags: string[];
  currentInterval: number;
  easeFactor: number;
  reviews: number;
  lapses: number;
  cardType: string;
  noteId: number;
}

/**
 * Deck information structure
 */
export interface DeckInfo {
  name: string;
  stats?: DeckStats;
}

/**
 * Deck statistics
 */
export interface DeckStats {
  deck_id: number;
  name: string;
  new_count: number;
  learn_count: number;
  review_count: number;
  total_new: number;
  total_cards: number;
}

/**
 * Rating options for spaced repetition
 */
export enum CardRating {
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4,
}

/**
 * AnkiConnect request structure
 */
export interface AnkiConnectRequest {
  action: string;
  version: number;
  params?: Record<string, any>;
  key?: string;
}

/**
 * AnkiConnect response structure
 */
export interface AnkiConnectResponse<T = any> {
  result: T;
  error: string | null;
}