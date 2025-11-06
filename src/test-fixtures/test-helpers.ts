/**
 * Helper functions for testing MCP tools
 */

/**
 * Parse the result from MCP tool response format
 * MCP tools return responses wrapped in a specific format with content array
 */
export function parseToolResult(result: any): any {
  if (result?.content?.[0]?.text) {
    return JSON.parse(result.content[0].text);
  }
  return result;
}

/**
 * Create a mock context for MCP tools
 */
export function createMockContext() {
  return {
    reportProgress: jest.fn().mockResolvedValue(undefined),
    log: {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    },
    mcpServer: {} as any,
    mcpRequest: {} as any,
  };
}
