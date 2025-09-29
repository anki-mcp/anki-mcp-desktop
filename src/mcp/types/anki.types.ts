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

/**
 * Options for duplicate checking when adding notes
 */
export interface NoteOptions {
  /** Whether to allow adding duplicate notes (default: false) */
  allowDuplicate?: boolean;

  /** Scope for duplicate checking: "deck" checks only target deck, "collection" checks entire collection */
  duplicateScope?: 'deck' | 'collection';

  /** Advanced options for duplicate scope checking */
  duplicateScopeOptions?: {
    /** Specific deck to check for duplicates in (if undefined, uses target deck) */
    deckName?: string;
    /** Whether to check child decks for duplicates (default: false) */
    checkChildren?: boolean;
    /** Whether to check across all note types/models (default: false) */
    checkAllModels?: boolean;
  };
}

/**
 * Parameters for adding a new note to Anki
 */
export interface AddNoteParams {
  /** The deck to add the note to */
  deckName: string;

  /** The note type/model to use (e.g., "Basic", "Basic (and reversed card)", "Cloze") */
  modelName: string;

  /** Field values as key-value pairs (e.g., {"Front": "question", "Back": "answer"}) */
  fields: Record<string, string>;

  /** Optional tags to add to the note for organization and searching */
  tags?: string[];

  /** Options for duplicate checking and handling */
  options?: NoteOptions;
}

/**
 * Information about an Anki note type/model
 */
export interface Model {
  /** The name of the model as displayed in Anki */
  name: string;

  /** Unique identifier for the model */
  id: number;

  /** CSS styling used for rendering cards of this type */
  css: string;

  /** Array of field names in the order they appear in the model */
  fields: string[];
}

/**
 * Detailed information about an Anki note
 */
export interface NoteInfo {
  /** The unique identifier of the note */
  noteId: number;

  /** The name of the model/note type used by this note */
  modelName: string;

  /** Tags associated with the note */
  tags: string[];

  /** Fields with their content and order */
  fields: Record<string, { value: string; order: number }>;

  /** Array of card IDs associated with this note */
  cards: number[];

  /** Modification timestamp (Unix timestamp in milliseconds) */
  mod: number;
}

/**
 * Parameters for updating note fields
 */
export interface UpdateNoteFieldsParams {
  /** The note to update */
  note: {
    /** ID of the note to update */
    id: number;

    /** Fields to update with new content (HTML supported) */
    fields: Record<string, string>;

    /** Optional audio files to add */
    audio?: Array<{
      url: string;
      filename: string;
      fields: string[];
    }>;

    /** Optional images to add */
    picture?: Array<{
      url: string;
      filename: string;
      fields: string[];
    }>;
  };
}