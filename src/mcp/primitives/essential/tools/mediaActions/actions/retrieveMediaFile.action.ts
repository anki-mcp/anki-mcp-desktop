import { AnkiConnectClient } from '@/mcp/clients/anki-connect.client';

/**
 * Parameters for retrieveMediaFile action
 */
export interface RetrieveMediaFileParams {
  /** Name of the file to retrieve (e.g., "pronunciation.mp3") */
  filename: string;
}

/**
 * Result of retrieveMediaFile action
 */
export interface RetrieveMediaFileResult {
  success: boolean;
  filename: string;
  data: string | null;
  message: string;
  found: boolean;
}

/**
 * Retrieve a media file from Anki's collection.media folder
 * Returns base64-encoded file content or null if not found
 */
export async function retrieveMediaFile(
  params: RetrieveMediaFileParams,
  client: AnkiConnectClient,
): Promise<RetrieveMediaFileResult> {
  const { filename } = params;

  // Validate filename
  if (!filename || filename.trim() === '') {
    throw new Error('Filename cannot be empty');
  }

  // Call AnkiConnect
  const result = await client.invoke<string | false>('retrieveMediaFile', {
    filename,
  });

  // AnkiConnect returns base64 string on success, false if file doesn't exist
  if (result === false) {
    return {
      success: true,
      filename,
      data: null,
      message: `Media file not found: ${filename}`,
      found: false,
    };
  }

  return {
    success: true,
    filename,
    data: result,
    message: `Successfully retrieved media file: ${filename}`,
    found: true,
  };
}
