import { Test, TestingModule } from '@nestjs/testing';
import { GuiDeckBrowserTool } from '../gui-deck-browser.tool';
import { AnkiConnectClient } from '../../../../clients/anki-connect.client';
import { parseToolResult, createMockContext } from '../../../../../test-fixtures/test-helpers';

const mockAnkiClient = {
  invoke: jest.fn(),
};

describe('GuiDeckBrowserTool', () => {
  let tool: GuiDeckBrowserTool;
  let mockContext: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuiDeckBrowserTool,
        {
          provide: AnkiConnectClient,
          useValue: mockAnkiClient,
        },
      ],
    }).compile();

    tool = module.get<GuiDeckBrowserTool>(GuiDeckBrowserTool);
    mockContext = createMockContext();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(tool).toBeDefined();
  });

  describe('guiDeckBrowser', () => {
    it('should successfully open deck browser', async () => {
      mockAnkiClient.invoke.mockResolvedValue(null);

      const rawResult = await tool.guiDeckBrowser({}, mockContext);
      const result = parseToolResult(rawResult);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Deck Browser opened');
      expect(mockAnkiClient.invoke).toHaveBeenCalledWith('guiDeckBrowser');
      expect(mockContext.reportProgress).toHaveBeenCalledTimes(2);
    });

    it('should handle errors', async () => {
      const error = new Error('GUI not available');
      mockAnkiClient.invoke.mockRejectedValue(error);

      const rawResult = await tool.guiDeckBrowser({}, mockContext);
      const result = parseToolResult(rawResult);

      expect(result.success).toBe(false);
      expect(result.error).toContain('GUI not available');
      expect(result.hint).toContain('Make sure Anki is running');
    });
  });
});
