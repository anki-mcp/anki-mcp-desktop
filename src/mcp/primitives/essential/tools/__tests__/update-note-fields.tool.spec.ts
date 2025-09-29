import { Test, TestingModule } from '@nestjs/testing';
import { UpdateNoteFieldsTool } from '../update-note-fields.tool';
import { AnkiConnectClient, AnkiConnectError } from '../../../../clients/anki-connect.client';
import { mockNotes } from '../../../../../test-fixtures/mock-data';
import { parseToolResult, createMockContext } from '../../../../../test-fixtures/test-helpers';

jest.mock('../../../../clients/anki-connect.client');

describe('UpdateNoteFieldsTool', () => {
  let tool: UpdateNoteFieldsTool;
  let ankiClient: jest.Mocked<AnkiConnectClient>;
  let mockContext: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateNoteFieldsTool,
        AnkiConnectClient,
      ],
    }).compile();

    tool = module.get<UpdateNoteFieldsTool>(UpdateNoteFieldsTool);
    ankiClient = module.get(AnkiConnectClient) as jest.Mocked<AnkiConnectClient>;

    mockContext = createMockContext();

    jest.clearAllMocks();
  });

  describe('updateNoteFields', () => {
    it('should successfully update note fields', async () => {
      // Arrange
      const noteId = mockNotes.spanish.noteId;
      const updatedFields = {
        'Front': '¿Qué tal?',
        'Back': 'How are you doing?'
      };

      ankiClient.invoke
        .mockResolvedValueOnce([mockNotes.spanish]) // notesInfo call
        .mockResolvedValueOnce(null); // updateNoteFields call

      // Act
      const rawResult = await tool.updateNoteFields({
        note: {
          id: noteId,
          fields: updatedFields
        }
      }, mockContext);
      const result = parseToolResult(rawResult);

      // Assert
      expect(ankiClient.invoke).toHaveBeenCalledTimes(2);
      expect(ankiClient.invoke).toHaveBeenNthCalledWith(1, 'notesInfo', {
        notes: [noteId]
      });
      expect(ankiClient.invoke).toHaveBeenNthCalledWith(2, 'updateNoteFields', {
        note: {
          id: noteId,
          fields: updatedFields
        }
      });

      expect(result.success).toBe(true);
      expect(result.noteId).toBe(noteId);
      expect(result.updatedFields).toEqual(['Front', 'Back']);
      expect(result.fieldCount).toBe(2);
      expect(result.message).toContain('Successfully updated 2 fields');
    });

    it('should handle HTML content in fields', async () => {
      // Arrange
      const noteId = mockNotes.withHtml.noteId;
      const htmlFields = {
        'Front': '<b>Updated</b> <em>HTML</em> content',
        'Back': '<ul><li>New item</li></ul>'
      };

      ankiClient.invoke
        .mockResolvedValueOnce([mockNotes.withHtml])
        .mockResolvedValueOnce(null);

      // Act
      const rawResult = await tool.updateNoteFields({
        note: {
          id: noteId,
          fields: htmlFields
        }
      }, mockContext);
      const result = parseToolResult(rawResult);

      // Assert
      expect(result.success).toBe(true);
      expect(result.cssNote).toContain('HTML content is preserved');
      expect(ankiClient.invoke).toHaveBeenNthCalledWith(2, 'updateNoteFields', {
        note: {
          id: noteId,
          fields: htmlFields
        }
      });
    });

    it('should reject update with no fields provided', async () => {
      // Arrange
      const noteId = 1234567890;

      // Act
      const rawResult = await tool.updateNoteFields({
        note: {
          id: noteId,
          fields: {}
        }
      }, mockContext);
      const result = parseToolResult(rawResult);

      // Assert
      expect(ankiClient.invoke).not.toHaveBeenCalled();
      expect(result.success).toBe(false);
      expect(result.error).toContain('No fields provided for update');
      expect(result.hint).toContain('Provide at least one field to update');
    });

    it('should handle note not found error', async () => {
      // Arrange
      const noteId = 9999999999;
      ankiClient.invoke.mockResolvedValueOnce([]); // Empty notesInfo response

      // Act
      const rawResult = await tool.updateNoteFields({
        note: {
          id: noteId,
          fields: { 'Front': 'Test' }
        }
      }, mockContext);
      const result = parseToolResult(rawResult);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Note not found');
      expect(result.hint).toContain('The note ID is invalid or the note has been deleted');
    });

    it('should validate fields exist in the model', async () => {
      // Arrange
      const noteId = mockNotes.spanish.noteId;
      const invalidFields = {
        'InvalidField': 'Some value',
        'AnotherInvalid': 'Another value'
      };

      ankiClient.invoke.mockResolvedValueOnce([mockNotes.spanish]);

      // Act
      const rawResult = await tool.updateNoteFields({
        note: {
          id: noteId,
          fields: invalidFields
        }
      }, mockContext);
      const result = parseToolResult(rawResult);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid fields for model');
      expect(result.invalidFields).toEqual(['InvalidField', 'AnotherInvalid']);
      expect(result.validFields).toEqual(['Front', 'Back']);
      expect(result.hint).toContain('These fields don\'t exist in the "Basic" model');
    });

    it('should handle partial field updates', async () => {
      // Arrange
      const noteId = mockNotes.spanish.noteId;
      const partialUpdate = {
        'Back': 'Updated answer only'
      };

      ankiClient.invoke
        .mockResolvedValueOnce([mockNotes.spanish])
        .mockResolvedValueOnce(null);

      // Act
      const rawResult = await tool.updateNoteFields({
        note: {
          id: noteId,
          fields: partialUpdate
        }
      }, mockContext);
      const result = parseToolResult(rawResult);

      // Assert
      expect(result.success).toBe(true);
      expect(result.updatedFields).toEqual(['Back']);
      expect(result.fieldCount).toBe(1);
      expect(result.message).toContain('Successfully updated 1 field');
    });

    it('should handle media attachments', async () => {
      // Arrange
      const noteId = mockNotes.spanish.noteId;
      const noteWithMedia = {
        id: noteId,
        fields: { 'Front': 'Test with audio' },
        audio: [{
          url: 'https://example.com/audio.mp3',
          filename: 'pronunciation.mp3',
          fields: ['Front']
        }],
        picture: [{
          url: 'https://example.com/image.jpg',
          filename: 'illustration.jpg',
          fields: ['Back']
        }]
      };

      ankiClient.invoke
        .mockResolvedValueOnce([mockNotes.spanish])
        .mockResolvedValueOnce(null);

      // Act
      const rawResult = await tool.updateNoteFields({ note: noteWithMedia }, mockContext);
      const result = parseToolResult(rawResult);

      // Assert
      expect(ankiClient.invoke).toHaveBeenNthCalledWith(2, 'updateNoteFields', {
        note: noteWithMedia
      });
      expect(result.success).toBe(true);
    });

    it('should warn about browser conflicts', async () => {
      // Arrange
      const noteId = mockNotes.spanish.noteId;
      ankiClient.invoke
        .mockResolvedValueOnce([mockNotes.spanish])
        .mockResolvedValueOnce(null);

      // Act
      const rawResult = await tool.updateNoteFields({
        note: {
          id: noteId,
          fields: { 'Front': 'Updated' }
        }
      }, mockContext);
      const result = parseToolResult(rawResult);

      // Assert
      expect(result.warning).toContain('If changes don\'t appear');
      expect(result.warning).toContain('ensure the note wasn\'t open in Anki browser');
    });

    it('should handle network errors', async () => {
      // Arrange
      ankiClient.invoke.mockRejectedValueOnce(new Error('fetch failed'));

      // Act
      const rawResult = await tool.updateNoteFields({
        note: {
          id: 123,
          fields: { 'Front': 'Test' }
        }
      }, mockContext);
      const result = parseToolResult(rawResult);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('fetch failed');
      expect(result.hint).toContain('Make sure Anki is running');
    });

    it('should handle AnkiConnect field errors', async () => {
      // Arrange
      const noteId = mockNotes.spanish.noteId;
      ankiClient.invoke
        .mockResolvedValueOnce([mockNotes.spanish])
        .mockRejectedValueOnce(new AnkiConnectError('field not found', 'updateNoteFields'));

      // Act
      const rawResult = await tool.updateNoteFields({
        note: {
          id: noteId,
          fields: { 'Front': 'Test' }
        }
      }, mockContext);
      const result = parseToolResult(rawResult);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('field');
      // The hint changes based on whether we get Note not found or field error
      expect(result.hint).toBeDefined();
    });

    it('should report progress correctly', async () => {
      // Arrange
      ankiClient.invoke
        .mockResolvedValueOnce([mockNotes.spanish])
        .mockResolvedValueOnce(null);

      // Act
      await tool.updateNoteFields({
        note: {
          id: mockNotes.spanish.noteId,
          fields: { 'Front': 'Test' }
        }
      }, mockContext);

      // Assert
      expect(mockContext.reportProgress).toHaveBeenCalledTimes(3);
      expect(mockContext.reportProgress).toHaveBeenNthCalledWith(1, { progress: 25, total: 100 });
      expect(mockContext.reportProgress).toHaveBeenNthCalledWith(2, { progress: 50, total: 100 });
      expect(mockContext.reportProgress).toHaveBeenNthCalledWith(3, { progress: 100, total: 100 });
    });

    it('should preserve model name in response', async () => {
      // Arrange
      ankiClient.invoke
        .mockResolvedValueOnce([mockNotes.japanese])
        .mockResolvedValueOnce(null);

      // Act
      const rawResult = await tool.updateNoteFields({
        note: {
          id: mockNotes.japanese.noteId,
          fields: { 'Front': 'Updated' }
        }
      }, mockContext);
      const result = parseToolResult(rawResult);

      // Assert
      expect(result.modelName).toBe('Basic (and reversed card)');
    });
  });
});