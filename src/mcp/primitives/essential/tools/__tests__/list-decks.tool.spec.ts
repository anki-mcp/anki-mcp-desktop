import { Test, TestingModule } from "@nestjs/testing";
import { ListDecksTool } from "../list-decks.tool";
import { AnkiConnectClient } from "../../../../clients/anki-connect.client";
import { mockDecks } from "../../../../../test-fixtures/mock-data";
import {
  parseToolResult,
  createMockContext,
} from "../../../../../test-fixtures/test-helpers";

// Mock the AnkiConnectClient
jest.mock("../../../../clients/anki-connect.client");

describe("ListDecksTool", () => {
  let tool: ListDecksTool;
  let ankiClient: jest.Mocked<AnkiConnectClient>;
  let mockContext: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ListDecksTool, AnkiConnectClient],
    }).compile();

    tool = module.get<ListDecksTool>(ListDecksTool);
    ankiClient = module.get(
      AnkiConnectClient,
    ) as jest.Mocked<AnkiConnectClient>;

    // Setup mock context
    mockContext = createMockContext();

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe("listDecks", () => {
    it("should return deck names without stats when include_stats is false", async () => {
      // Arrange
      ankiClient.invoke.mockResolvedValueOnce(mockDecks.names);

      // Act
      const rawResult = await tool.listDecks(
        { include_stats: false },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      // Assert
      expect(ankiClient.invoke).toHaveBeenCalledTimes(1);
      expect(ankiClient.invoke).toHaveBeenCalledWith("deckNames");
      expect(result.success).toBe(true);
      expect(result.decks).toHaveLength(4);
      expect(result.decks[0]).toEqual({ name: "Default" });
      expect(result.summary).toBeUndefined();
      expect(mockContext.reportProgress).toHaveBeenCalled();
    });

    it("should return deck names with stats when include_stats is true", async () => {
      // Arrange
      const deckNames = ["Spanish", "Japanese::JLPT N5"];
      ankiClient.invoke
        .mockResolvedValueOnce(deckNames) // deckNames call
        .mockResolvedValueOnce(mockDecks.withStats); // getDeckStats call

      // Act
      const rawResult = await tool.listDecks(
        { include_stats: true },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      // Assert
      expect(ankiClient.invoke).toHaveBeenCalledTimes(2);
      expect(ankiClient.invoke).toHaveBeenNthCalledWith(1, "deckNames");
      expect(ankiClient.invoke).toHaveBeenNthCalledWith(2, "getDeckStats", {
        decks: deckNames,
      });

      expect(result.success).toBe(true);
      expect(result.decks).toHaveLength(2);

      // Check first deck stats
      const spanishDeck = result.decks.find((d: any) => d.name === "Spanish");
      expect(spanishDeck).toBeDefined();
      expect(spanishDeck.stats).toMatchObject({
        name: "Spanish",
        new_count: 20,
        learn_count: 5,
        review_count: 10,
        total_cards: 150,
      });

      // Check summary
      expect(result.summary).toMatchObject({
        total_cards: 650, // 150 + 500
        new_cards: 70, // 20 + 50
        learning_cards: 15, // 5 + 10
        review_cards: 35, // 10 + 25
      });
    });

    it("should handle empty deck list gracefully", async () => {
      // Arrange
      ankiClient.invoke.mockResolvedValueOnce([]);

      // Act
      const rawResult = await tool.listDecks(
        { include_stats: false },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe("No decks found in Anki");
      expect(result.decks).toEqual([]);
    });

    it("should handle getDeckStats returning empty stats", async () => {
      // Arrange
      const deckNames = ["Spanish", "NonExistentDeck"];
      ankiClient.invoke.mockResolvedValueOnce(deckNames).mockResolvedValueOnce({
        "1651445861967": {
          deck_id: 1651445861967,
          name: "Spanish",
          new_count: 10,
          learn_count: 5,
          review_count: 3,
          total_in_deck: 100,
        },
        // NonExistentDeck has no stats
      });

      // Act
      const rawResult = await tool.listDecks(
        { include_stats: true },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      // Assert
      expect(result.success).toBe(true);
      expect(result.decks).toHaveLength(2);

      const spanishDeck = result.decks.find((d: any) => d.name === "Spanish");
      expect(spanishDeck.stats).toBeDefined();

      const nonExistentDeck = result.decks.find(
        (d: any) => d.name === "NonExistentDeck",
      );
      expect(nonExistentDeck).toEqual({ name: "NonExistentDeck" });
    });

    it("should handle network errors gracefully", async () => {
      // Arrange
      const networkError = new Error("fetch failed");
      ankiClient.invoke.mockRejectedValueOnce(networkError);

      // Act
      const rawResult = await tool.listDecks(
        { include_stats: false },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain("fetch failed");
    });

    it("should handle AnkiConnect errors when getting stats", async () => {
      // Arrange
      ankiClient.invoke
        .mockResolvedValueOnce(["Spanish"])
        .mockRejectedValueOnce(
          new Error("AnkiConnect error: collection is not available"),
        );

      // Act
      const rawResult = await tool.listDecks(
        { include_stats: true },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("collection is not available");
    });

    it("should correctly parse deck stats response format", async () => {
      // Arrange
      const deckNames = ["Nested::Deck::Path"];
      const statsResponse = {
        "1234567890": {
          deck_id: 1234567890,
          name: "Nested::Deck::Path",
          new_count: 15,
          learn_count: 7,
          review_count: 22,
          total_in_deck: 250,
        },
      };

      ankiClient.invoke
        .mockResolvedValueOnce(deckNames)
        .mockResolvedValueOnce(statsResponse);

      // Act
      const rawResult = await tool.listDecks(
        { include_stats: true },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      // Assert
      expect(result.success).toBe(true);
      expect(result.decks).toHaveLength(1);
      expect(result.decks[0].stats).toMatchObject({
        name: "Nested::Deck::Path",
        new_count: 15,
        learn_count: 7,
        review_count: 22,
        total_cards: 250, // Note: mapped from total_in_deck
      });
    });

    it("should report progress correctly", async () => {
      // Arrange
      ankiClient.invoke.mockResolvedValueOnce(["Deck1"]);

      // Act
      await tool.listDecks({ include_stats: false }, mockContext);

      // Assert
      expect(mockContext.reportProgress).toHaveBeenCalledTimes(3);
      expect(mockContext.reportProgress).toHaveBeenNthCalledWith(1, {
        progress: 10,
        total: 100,
      });
      expect(mockContext.reportProgress).toHaveBeenNthCalledWith(2, {
        progress: 50,
        total: 100,
      });
      expect(mockContext.reportProgress).toHaveBeenNthCalledWith(3, {
        progress: 100,
        total: 100,
      });
    });
  });
});
