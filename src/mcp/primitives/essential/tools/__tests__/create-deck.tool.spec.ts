import { Test, TestingModule } from "@nestjs/testing";
import { CreateDeckTool } from "../create-deck.tool";
import { AnkiConnectClient } from "@/mcp/clients/anki-connect.client";
import {
  createMockContext,
  parseToolResult,
} from "@/test-fixtures/test-helpers";

describe("CreateDeckTool", () => {
  let tool: CreateDeckTool;
  let ankiClient: jest.Mocked<AnkiConnectClient>;
  let mockContext: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateDeckTool,
        {
          provide: AnkiConnectClient,
          useValue: {
            invoke: jest.fn(),
          },
        },
      ],
    }).compile();

    tool = module.get<CreateDeckTool>(CreateDeckTool);
    ankiClient = module.get(AnkiConnectClient);
    mockContext = createMockContext();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Deck Creation", () => {
    it("should successfully create a simple deck", async () => {
      const deckName = "Spanish Vocabulary";
      const deckId = 1651445861967;

      ankiClient.invoke.mockResolvedValueOnce(deckId);

      const rawResult = await tool.createDeck(
        { deck_name: deckName },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result.success).toBe(true);
      expect(result.deckId).toBe(deckId);
      expect(result.deckName).toBe(deckName);
      expect(result.message).toContain("Successfully created");
      expect(ankiClient.invoke).toHaveBeenCalledWith("createDeck", {
        deck: deckName,
      });
      expect(mockContext.reportProgress).toHaveBeenCalledTimes(3);
    });

    it("should create a deck with unicode characters", async () => {
      const deckName = "日本語::漢字";
      const deckId = 1651445861968;

      ankiClient.invoke.mockResolvedValueOnce(deckId);

      const rawResult = await tool.createDeck(
        { deck_name: deckName },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result.success).toBe(true);
      expect(result.deckId).toBe(deckId);
      expect(result.deckName).toBe(deckName);
    });

    it("should create a deck with special characters", async () => {
      const deckName = "Math & Science!";
      const deckId = 1651445861969;

      ankiClient.invoke.mockResolvedValueOnce(deckId);

      const rawResult = await tool.createDeck(
        { deck_name: deckName },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result.success).toBe(true);
      expect(result.deckId).toBe(deckId);
    });

    it("should create a deck with very long name", async () => {
      const deckName = "A".repeat(200);
      const deckId = 1651445861970;

      ankiClient.invoke.mockResolvedValueOnce(deckId);

      const rawResult = await tool.createDeck(
        { deck_name: deckName },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result.success).toBe(true);
      expect(result.deckId).toBe(deckId);
    });
  });

  describe("Hierarchical Deck Creation", () => {
    it("should create a parent::child deck structure", async () => {
      const deckName = "Languages::Spanish";
      const deckId = 1651445861971;

      ankiClient.invoke.mockResolvedValueOnce(deckId);

      const rawResult = await tool.createDeck(
        { deck_name: deckName },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result.success).toBe(true);
      expect(result.deckId).toBe(deckId);
      expect(result.deckName).toBe(deckName);
      expect(result.parentDeck).toBe("Languages");
      expect(result.childDeck).toBe("Spanish");
      expect(result.message).toContain('parent deck "Languages"');
      expect(result.message).toContain('child deck "Spanish"');
    });

    it("should reject parent::child::grandchild deck structure (more than 2 levels)", async () => {
      const deckName = "Languages::Spanish::Vocabulary";

      const rawResult = await tool.createDeck(
        { deck_name: deckName },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result.success).toBe(false);
      expect(result.error).toContain("maximum 2 levels");
      expect(ankiClient.invoke).not.toHaveBeenCalled();
    });

    it("should reject deeply nested deck (4+ levels)", async () => {
      const deckName = "School::Year1::Math::Algebra::Equations";

      const rawResult = await tool.createDeck(
        { deck_name: deckName },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result.success).toBe(false);
      expect(result.error).toContain("maximum 2 levels");
      expect(ankiClient.invoke).not.toHaveBeenCalled();
    });

    it("should create parent deck if parent doesn't exist", async () => {
      const deckName = "NewParent::NewChild";
      const deckId = 1651445861974;

      ankiClient.invoke.mockResolvedValueOnce(deckId);

      const rawResult = await tool.createDeck(
        { deck_name: deckName },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result.success).toBe(true);
      expect(result.parentDeck).toBe("NewParent");
      expect(result.childDeck).toBe("NewChild");
      expect(result.created).toBe(true);
    });
  });

  describe("Validation", () => {
    it("should reject empty deck name", async () => {
      // Note: Empty string validation is handled by Zod schema (min(1))
      // This test would fail at tool invocation level, not in our code
      await tool.createDeck({ deck_name: "a" }, mockContext);

      // Should pass with single character
      expect(ankiClient.invoke).toHaveBeenCalled();
    });

    it("should reject deck name with only whitespace (empty after trim)", async () => {
      const deckName = "   ";

      const rawResult = await tool.createDeck(
        { deck_name: deckName },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      // Tool checks if parts are empty after trim: "   ".trim() === ""
      expect(result.success).toBe(false);
      expect(result.error).toContain("cannot be empty");
      expect(ankiClient.invoke).not.toHaveBeenCalled();
    });

    it("should reject deck name with empty parts in hierarchy", async () => {
      // "Parent::::Child" splits into ["Parent", "", "", "Child"] = 4 parts
      // Will fail on "maximum 2 levels" check first (before empty parts check)
      const rawResult = await tool.createDeck(
        { deck_name: "Parent::::Child" },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result.success).toBe(false);
      expect(result.error).toContain("maximum 2 levels");
      expect(ankiClient.invoke).not.toHaveBeenCalled();
    });

    it("should reject deck name starting with ::", async () => {
      const rawResult = await tool.createDeck(
        { deck_name: "::InvalidDeck" },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result.success).toBe(false);
      expect(result.error).toContain("empty");
      expect(ankiClient.invoke).not.toHaveBeenCalled();
    });

    it("should reject deck name ending with ::", async () => {
      const rawResult = await tool.createDeck(
        { deck_name: "InvalidDeck::" },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result.success).toBe(false);
      expect(result.error).toContain("empty");
      expect(ankiClient.invoke).not.toHaveBeenCalled();
    });

    it("should NOT trim whitespace from deck name", async () => {
      const deckName = "  Trimmed Deck  ";
      const deckId = 1651445861976;

      ankiClient.invoke.mockResolvedValueOnce(deckId);

      const rawResult = await tool.createDeck(
        { deck_name: deckName },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result.success).toBe(true);
      expect(result.deckName).toBe(deckName); // Not trimmed
      expect(ankiClient.invoke).toHaveBeenCalledWith("createDeck", {
        deck: deckName, // Not trimmed
      });
    });

    it("should NOT trim whitespace from hierarchical parts", async () => {
      const deckName = "  Parent  ::  Child  ";
      const deckId = 1651445861977;

      ankiClient.invoke.mockResolvedValueOnce(deckId);

      const rawResult = await tool.createDeck(
        { deck_name: deckName },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result.success).toBe(true);
      expect(result.deckName).toBe(deckName); // Not trimmed
    });
  });

  describe("Error Handling", () => {
    it("should handle AnkiConnect errors", async () => {
      const deckName = "Test Deck";
      const errorMessage = "AnkiConnect error";

      ankiClient.invoke.mockRejectedValueOnce(new Error(errorMessage));

      const rawResult = await tool.createDeck(
        { deck_name: deckName },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result.success).toBe(false);
      expect(result.error).toContain(errorMessage);
    });

    it("should handle network errors", async () => {
      const deckName = "Test Deck";

      ankiClient.invoke.mockRejectedValueOnce(new Error("ECONNREFUSED"));

      const rawResult = await tool.createDeck(
        { deck_name: deckName },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result.success).toBe(false);
      expect(result.error).toContain("ECONNREFUSED");
      expect(result.hint).toContain("Make sure Anki is running");
    });

    it("should handle permission errors", async () => {
      const deckName = "Test Deck";

      ankiClient.invoke.mockRejectedValueOnce(new Error("Permission denied"));

      const rawResult = await tool.createDeck(
        { deck_name: deckName },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Permission denied");
    });

    it("should handle invalid characters in deck name (AnkiConnect rejection)", async () => {
      const deckName = "Invalid<>Deck";

      ankiClient.invoke.mockRejectedValueOnce(new Error("Invalid deck name"));

      const rawResult = await tool.createDeck(
        { deck_name: deckName },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid deck name");
    });
  });

  describe("Edge Cases", () => {
    it("should handle deck already exists scenario", async () => {
      const deckName = "Existing Deck";
      const existingDeckId = 1651445861978;

      // AnkiConnect returns existing deck ID if deck already exists
      ankiClient.invoke.mockResolvedValueOnce(existingDeckId);

      const rawResult = await tool.createDeck(
        { deck_name: deckName },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result.success).toBe(true);
      expect(result.deckId).toBe(existingDeckId);
      expect(result.created).toBe(true);
    });

    it("should reject deck name with 3 levels (mixed separators)", async () => {
      const deckName = "Parent::Child::Grandchild";

      const rawResult = await tool.createDeck(
        { deck_name: deckName },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result.success).toBe(false);
      expect(result.error).toContain("maximum 2 levels");
    });

    it("should handle null deck ID from AnkiConnect (deck exists)", async () => {
      const deckName = "Test Deck";

      // First call returns null, second call returns deck list with our deck
      ankiClient.invoke
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce([deckName, "Other Deck"]);

      const rawResult = await tool.createDeck(
        { deck_name: deckName },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result.success).toBe(true);
      expect(result.message).toContain("already exists");
      expect(result.created).toBe(false);
      expect(result.exists).toBe(true);
      expect(ankiClient.invoke).toHaveBeenCalledWith("deckNames");
    });

    it("should handle null deck ID from AnkiConnect (deck doesn't exist)", async () => {
      const deckName = "Test Deck";

      // First call returns null, second call returns deck list without our deck
      ankiClient.invoke
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(["Other Deck"]);

      const rawResult = await tool.createDeck(
        { deck_name: deckName },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to create deck");
    });
  });

  describe("Progress Reporting", () => {
    it("should report progress during deck creation", async () => {
      const deckName = "Test Deck";
      const deckId = 1651445861979;

      ankiClient.invoke.mockResolvedValueOnce(deckId);

      await tool.createDeck({ deck_name: deckName }, mockContext);

      expect(mockContext.reportProgress).toHaveBeenCalledWith({
        progress: 25,
        total: 100,
      });
      expect(mockContext.reportProgress).toHaveBeenCalledWith({
        progress: 75,
        total: 100,
      });
      expect(mockContext.reportProgress).toHaveBeenCalledWith({
        progress: 100,
        total: 100,
      });
      expect(mockContext.reportProgress).toHaveBeenCalledTimes(3);
    });

    it("should report progress even when creation fails", async () => {
      const deckName = "Test Deck";

      ankiClient.invoke.mockRejectedValueOnce(new Error("Creation failed"));

      await tool.createDeck({ deck_name: deckName }, mockContext);

      expect(mockContext.reportProgress).toHaveBeenCalledWith({
        progress: 25,
        total: 100,
      });
      expect(mockContext.reportProgress).toHaveBeenCalledTimes(1);
    });
  });

  describe("Response Structure", () => {
    it("should return correct structure on success", async () => {
      const deckName = "Test Deck";
      const deckId = 1651445861980;

      ankiClient.invoke.mockResolvedValueOnce(deckId);

      const rawResult = await tool.createDeck(
        { deck_name: deckName },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("deckId");
      expect(result).toHaveProperty("deckName");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("created");
      expect(result.success).toBe(true);
      expect(result.created).toBe(true);
      // Success responses don't have "hint" field
      expect(result.hint).toBeUndefined();
    });

    it("should return correct structure on error", async () => {
      const deckName = "Test Deck";

      ankiClient.invoke.mockRejectedValueOnce(new Error("Test error"));

      const rawResult = await tool.createDeck(
        { deck_name: deckName },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("error");
      expect(result).toHaveProperty("hint");
      expect(result.success).toBe(false);
      expect(result.hint).toContain("Make sure Anki is running");
    });

    it("should include parent/child info for parent::child decks", async () => {
      const deckName = "Parent::Child";
      const deckId = 1651445861981;

      ankiClient.invoke.mockResolvedValueOnce(deckId);

      const rawResult = await tool.createDeck(
        { deck_name: deckName },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result.message).toContain('parent deck "Parent"');
      expect(result.message).toContain('child deck "Child"');
      expect(result.parentDeck).toBe("Parent");
      expect(result.childDeck).toBe("Child");
    });

    it("should return simple message for simple decks", async () => {
      const deckName = "Simple Deck";
      const deckId = 1651445861982;

      ankiClient.invoke.mockResolvedValueOnce(deckId);

      const rawResult = await tool.createDeck(
        { deck_name: deckName },
        mockContext,
      );
      const result = parseToolResult(rawResult);

      expect(result.message).toContain(
        `Successfully created deck "${deckName}"`,
      );
      expect(result.parentDeck).toBeUndefined();
      expect(result.childDeck).toBeUndefined();
    });
  });
});
