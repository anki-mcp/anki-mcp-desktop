import { Test, TestingModule } from '@nestjs/testing';
import { MediaActionsTool } from '../mediaActions.tool';
import { AnkiConnectClient } from '@/mcp/clients/anki-connect.client';
import { parseToolResult, createMockContext } from '@/test-fixtures/test-helpers';

// Mock the AnkiConnectClient
jest.mock('@/mcp/clients/anki-connect.client');

describe('MediaActionsTool', () => {
  let tool: MediaActionsTool;
  let ankiClient: jest.Mocked<AnkiConnectClient>;
  let mockContext: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MediaActionsTool, AnkiConnectClient],
    }).compile();

    tool = module.get<MediaActionsTool>(MediaActionsTool);
    ankiClient = module.get(AnkiConnectClient) as jest.Mocked<AnkiConnectClient>;

    // Setup mock context
    mockContext = createMockContext();

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('storeMediaFile action', () => {
    it('should store media file with base64 data', async () => {
      // Arrange
      const params = {
        action: 'storeMediaFile' as const,
        filename: 'test_audio.mp3',
        data: 'base64EncodedData==',
        deleteExisting: true,
      };
      ankiClient.invoke.mockResolvedValueOnce('test_audio.mp3');

      // Act
      const rawResult = await tool.execute(params, mockContext);
      const result = parseToolResult(rawResult);

      // Assert
      expect(ankiClient.invoke).toHaveBeenCalledWith('storeMediaFile', {
        filename: 'test_audio.mp3',
        data: 'base64EncodedData==',
        deleteExisting: true,
      });
      expect(result.success).toBe(true);
      expect(result.filename).toBe('test_audio.mp3');
      expect(result.prefixedWithUnderscore).toBe(false);
    });

    it('should store media file with file path', async () => {
      // Arrange
      const params = {
        action: 'storeMediaFile' as const,
        filename: 'image.jpg',
        path: '/absolute/path/to/image.jpg',
      };
      ankiClient.invoke.mockResolvedValueOnce('image.jpg');

      // Act
      const rawResult = await tool.execute(params, mockContext);
      const result = parseToolResult(rawResult);

      // Assert
      expect(ankiClient.invoke).toHaveBeenCalledWith('storeMediaFile', {
        filename: 'image.jpg',
        path: '/absolute/path/to/image.jpg',
        deleteExisting: true,
      });
      expect(result.success).toBe(true);
      expect(result.filename).toBe('image.jpg');
    });

    it('should store media file with URL', async () => {
      // Arrange
      const params = {
        action: 'storeMediaFile' as const,
        filename: 'remote.mp3',
        url: 'https://example.com/audio.mp3',
      };
      ankiClient.invoke.mockResolvedValueOnce('remote.mp3');

      // Act
      const rawResult = await tool.execute(params, mockContext);
      const result = parseToolResult(rawResult);

      // Assert
      expect(ankiClient.invoke).toHaveBeenCalledWith('storeMediaFile', {
        filename: 'remote.mp3',
        url: 'https://example.com/audio.mp3',
        deleteExisting: true,
      });
      expect(result.success).toBe(true);
    });

    it('should detect underscore prefix in filename', async () => {
      // Arrange
      const params = {
        action: 'storeMediaFile' as const,
        filename: '_preserved_audio.mp3',
        data: 'base64Data',
      };
      ankiClient.invoke.mockResolvedValueOnce('_preserved_audio.mp3');

      // Act
      const rawResult = await tool.execute(params, mockContext);
      const result = parseToolResult(rawResult);

      // Assert
      expect(result.prefixedWithUnderscore).toBe(true);
    });

    it('should handle store failure', async () => {
      // Arrange
      const params = {
        action: 'storeMediaFile' as const,
        filename: 'test.mp3',
        data: 'base64',
      };
      ankiClient.invoke.mockResolvedValueOnce(null);

      // Act
      const rawResult = await tool.execute(params, mockContext);
      const result = parseToolResult(rawResult);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to store media file');
    });
  });

  describe('retrieveMediaFile action', () => {
    it('should retrieve existing media file', async () => {
      // Arrange
      const params = {
        action: 'retrieveMediaFile' as const,
        filename: 'existing.mp3',
      };
      ankiClient.invoke.mockResolvedValueOnce('base64EncodedFileContent==');

      // Act
      const rawResult = await tool.execute(params, mockContext);
      const result = parseToolResult(rawResult);

      // Assert
      expect(ankiClient.invoke).toHaveBeenCalledWith('retrieveMediaFile', {
        filename: 'existing.mp3',
      });
      expect(result.success).toBe(true);
      expect(result.filename).toBe('existing.mp3');
      expect(result.data).toBe('base64EncodedFileContent==');
      expect(result.found).toBe(true);
    });

    it('should handle non-existent file', async () => {
      // Arrange
      const params = {
        action: 'retrieveMediaFile' as const,
        filename: 'nonexistent.mp3',
      };
      ankiClient.invoke.mockResolvedValueOnce(false);

      // Act
      const rawResult = await tool.execute(params, mockContext);
      const result = parseToolResult(rawResult);

      // Assert
      expect(result.success).toBe(true);
      expect(result.found).toBe(false);
      expect(result.data).toBeNull();
      expect(result.message).toContain('not found');
    });
  });

  describe('getMediaFilesNames action', () => {
    it('should list all media files without pattern', async () => {
      // Arrange
      const params = {
        action: 'getMediaFilesNames' as const,
      };
      const mockFiles = ['audio1.mp3', 'audio2.mp3', 'image1.jpg'];
      ankiClient.invoke.mockResolvedValueOnce(mockFiles);

      // Act
      const rawResult = await tool.execute(params, mockContext);
      const result = parseToolResult(rawResult);

      // Assert
      expect(ankiClient.invoke).toHaveBeenCalledWith('getMediaFilesNames', {});
      expect(result.success).toBe(true);
      expect(result.files).toEqual(mockFiles);
      expect(result.count).toBe(3);
    });

    it('should list media files with pattern', async () => {
      // Arrange
      const params = {
        action: 'getMediaFilesNames' as const,
        pattern: '*.mp3',
      };
      const mockFiles = ['audio1.mp3', 'audio2.mp3'];
      ankiClient.invoke.mockResolvedValueOnce(mockFiles);

      // Act
      const rawResult = await tool.execute(params, mockContext);
      const result = parseToolResult(rawResult);

      // Assert
      expect(ankiClient.invoke).toHaveBeenCalledWith('getMediaFilesNames', {
        pattern: '*.mp3',
      });
      expect(result.success).toBe(true);
      expect(result.files).toEqual(mockFiles);
      expect(result.count).toBe(2);
      expect(result.pattern).toBe('*.mp3');
    });

    it('should handle empty file list', async () => {
      // Arrange
      const params = {
        action: 'getMediaFilesNames' as const,
      };
      ankiClient.invoke.mockResolvedValueOnce([]);

      // Act
      const rawResult = await tool.execute(params, mockContext);
      const result = parseToolResult(rawResult);

      // Assert
      expect(result.success).toBe(true);
      expect(result.files).toEqual([]);
      expect(result.count).toBe(0);
    });
  });

  describe('deleteMediaFile action', () => {
    it('should delete media file', async () => {
      // Arrange
      const params = {
        action: 'deleteMediaFile' as const,
        filename: 'old_audio.mp3',
      };
      ankiClient.invoke.mockResolvedValueOnce(undefined);

      // Act
      const rawResult = await tool.execute(params, mockContext);
      const result = parseToolResult(rawResult);

      // Assert
      expect(ankiClient.invoke).toHaveBeenCalledWith('deleteMediaFile', {
        filename: 'old_audio.mp3',
      });
      expect(result.success).toBe(true);
      expect(result.filename).toBe('old_audio.mp3');
      expect(result.message).toContain('Successfully deleted');
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      // Arrange
      const params = {
        action: 'storeMediaFile' as const,
        filename: 'test.mp3',
        data: 'base64',
      };
      ankiClient.invoke.mockRejectedValueOnce(new Error('Network error'));

      // Act
      const rawResult = await tool.execute(params, mockContext);
      const result = parseToolResult(rawResult);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('progress reporting', () => {
    it('should report progress for storeMediaFile', async () => {
      // Arrange
      const params = {
        action: 'storeMediaFile' as const,
        filename: 'test.mp3',
        data: 'base64',
      };
      ankiClient.invoke.mockResolvedValueOnce('test.mp3');

      // Act
      await tool.execute(params, mockContext);

      // Assert
      expect(mockContext.reportProgress).toHaveBeenCalledWith({
        progress: 25,
        total: 100,
      });
      expect(mockContext.reportProgress).toHaveBeenCalledWith({
        progress: 100,
        total: 100,
      });
    });

    it('should report progress for retrieveMediaFile', async () => {
      // Arrange
      const params = {
        action: 'retrieveMediaFile' as const,
        filename: 'test.mp3',
      };
      ankiClient.invoke.mockResolvedValueOnce('base64Data');

      // Act
      await tool.execute(params, mockContext);

      // Assert
      expect(mockContext.reportProgress).toHaveBeenCalledWith({
        progress: 50,
        total: 100,
      });
      expect(mockContext.reportProgress).toHaveBeenCalledWith({
        progress: 100,
        total: 100,
      });
    });
  });
});
