import { AnkiConnectClient } from "@/mcp/clients/anki-connect.client";

/**
 * Parameters for getMediaFilesNames action
 */
export interface GetMediaFilesNamesParams {
  /** Optional pattern to filter files (e.g., "*.mp3", "audio_*") */
  pattern?: string;
}

/**
 * Result of getMediaFilesNames action
 */
export interface GetMediaFilesNamesResult {
  success: boolean;
  files: string[];
  count: number;
  message: string;
  pattern?: string;
}

/**
 * Get names of media files in Anki's collection.media folder
 * Optionally filter by pattern
 */
export async function getMediaFilesNames(
  params: GetMediaFilesNamesParams,
  client: AnkiConnectClient,
): Promise<GetMediaFilesNamesResult> {
  const { pattern } = params;

  // Build AnkiConnect params
  const ankiParams: Record<string, any> = {};
  if (pattern) {
    ankiParams.pattern = pattern;
  }

  // Call AnkiConnect
  const result = await client.invoke<string[]>(
    "getMediaFilesNames",
    ankiParams,
  );

  const message = pattern
    ? `Found ${result.length} media file(s) matching pattern "${pattern}"`
    : `Found ${result.length} media file(s)`;

  return {
    success: true,
    files: result,
    count: result.length,
    message,
    ...(pattern && { pattern }),
  };
}
