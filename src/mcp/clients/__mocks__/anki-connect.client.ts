// Manual mock for AnkiConnectClient
export const AnkiConnectClient = jest.fn().mockImplementation(() => ({
  invoke: jest.fn(),
}));

export class AnkiConnectError extends Error {
  constructor(
    message: string,
    public readonly action?: string,
    public readonly originalError?: string,
  ) {
    super(message);
    this.name = "AnkiConnectError";
  }
}
