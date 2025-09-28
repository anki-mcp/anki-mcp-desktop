import { Inject, Injectable, Logger } from '@nestjs/common';
import ky, { KyInstance, HTTPError } from 'ky';
import { ANKI_CONFIG } from '../config/anki-config.interface';
import type { IAnkiConfig } from '../config/anki-config.interface';
import { AnkiConnectRequest, AnkiConnectResponse } from '../types/anki.types';

/**
 * Error class for AnkiConnect-specific errors
 */
export class AnkiConnectError extends Error {
  constructor(
    message: string,
    public readonly action?: string,
    public readonly originalError?: string,
  ) {
    super(message);
    this.name = 'AnkiConnectError';
  }
}

/**
 * AnkiConnect client for communication with Anki via AnkiConnect plugin
 */
@Injectable()
export class AnkiConnectClient {
  private readonly client: KyInstance;
  private readonly apiVersion: number;
  private readonly apiKey?: string;
  private readonly logger = new Logger(AnkiConnectClient.name);

  constructor(@Inject(ANKI_CONFIG) private readonly config: IAnkiConfig) {
    this.apiVersion = config.ankiConnectApiVersion;
    this.apiKey = config.ankiConnectApiKey;

    // Create ky client with configuration
    this.client = ky.create({
      prefixUrl: config.ankiConnectUrl,
      timeout: config.ankiConnectTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
      retry: {
        limit: 2,
        methods: ['POST'],
        statusCodes: [408, 413, 429, 500, 502, 503, 504],
        backoffLimit: 3000,
      },
      hooks: {
        beforeRequest: [
          (request) => {
            this.logger.debug(
              `AnkiConnect request: ${request.method} ${request.url}`,
            );
          },
        ],
        afterResponse: [
          (_request, _options, response) => {
            this.logger.debug(
              `AnkiConnect response: ${response.status} ${response.statusText}`,
            );
          },
        ],
      },
    });
  }

  /**
   * Send a request to AnkiConnect
   * @param action - The AnkiConnect action to perform
   * @param params - Parameters for the action
   * @returns The result from AnkiConnect
   */
  async invoke<T = any>(
    action: string,
    params?: Record<string, any>,
  ): Promise<T> {
    const request: AnkiConnectRequest = {
      action,
      version: this.apiVersion,
      params,
    };

    // Add API key if configured
    if (this.apiKey) {
      request.key = this.apiKey;
    }

    try {
      this.logger.log(`Invoking AnkiConnect action: ${action}`);

      const response = await this.client
        .post('', {
          json: request,
        })
        .json<AnkiConnectResponse<T>>();

      // Check for AnkiConnect errors
      if (response.error) {
        throw new AnkiConnectError(
          `AnkiConnect error: ${response.error}`,
          action,
          response.error,
        );
      }

      this.logger.log(`AnkiConnect action successful: ${action}`);
      return response.result;
    } catch (error) {
      // Handle HTTP errors
      if (error instanceof HTTPError) {
        if (error.response.status === 403) {
          throw new AnkiConnectError(
            'Permission denied. Please check AnkiConnect configuration and API key.',
            action,
          );
        }
        throw new AnkiConnectError(
          `HTTP error ${error.response.status}: ${error.message}`,
          action,
        );
      }

      // Handle connection errors
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new AnkiConnectError(
          'Cannot connect to Anki. Please ensure Anki is running and AnkiConnect plugin is installed.',
          action,
        );
      }

      // Re-throw AnkiConnect errors
      if (error instanceof AnkiConnectError) {
        throw error;
      }

      // Wrap unknown errors
      throw new AnkiConnectError(
        `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
        action,
      );
    }
  }
}