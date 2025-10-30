import { spawn, ChildProcess } from 'child_process';
import http from 'http';

export interface NgrokTunnelInfo {
  publicUrl: string;
  apiUrl: string;
}

export class NgrokService {
  private process: ChildProcess | null = null;
  private cleanupHandlersRegistered = false;

  /**
   * Start ngrok tunnel and return the public URL
   * @param port - Local port to tunnel to
   * @returns NgrokTunnelInfo with public URL and API URL
   * @throws Error if ngrok is not installed or fails to start
   */
  async start(port: number): Promise<NgrokTunnelInfo> {
    // Check if ngrok is installed
    if (!(await this.isNgrokInstalled())) {
      throw new Error(
        'ngrok is not installed.\n' +
          'Install it with: npm install -g ngrok\n' +
          'Or download from: https://ngrok.com/download\n' +
          'Then setup auth: ngrok config add-authtoken <your-token>',
      );
    }

    // Start ngrok process
    this.process = spawn('ngrok', ['http', port.toString()], {
      stdio: 'pipe', // Capture output for debugging if needed
    });

    // Register cleanup handlers (only once)
    if (!this.cleanupHandlersRegistered) {
      this.registerCleanupHandlers();
      this.cleanupHandlersRegistered = true;
    }

    // Handle process errors
    this.process.on('error', (err) => {
      throw new Error(`Failed to start ngrok: ${err.message}`);
    });

    this.process.on('exit', (code, signal) => {
      if (code !== 0 && code !== null) {
        console.error(`ngrok exited with code ${code}`);
      }
    });

    // Wait for ngrok to start and get tunnel info
    await this.waitForNgrok();
    const publicUrl = await this.getTunnelUrl();

    return {
      publicUrl,
      apiUrl: 'http://localhost:4040',
    };
  }

  /**
   * Check if ngrok binary is installed globally
   */
  private async isNgrokInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
      const check = spawn('which', ['ngrok']);
      check.on('close', (code) => resolve(code === 0));
      check.on('error', () => resolve(false));
    });
  }

  /**
   * Wait for ngrok to start by polling the API
   */
  private async waitForNgrok(maxAttempts = 20, delayMs = 500): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      try {
        await this.getTunnelUrl();
        return; // Success - ngrok API is responding
      } catch {
        // Not ready yet, continue polling
      }
    }
    throw new Error(
      'ngrok failed to start in time.\n' +
        'Make sure you have configured your auth token:\n' +
        'ngrok config add-authtoken <your-token>',
    );
  }

  /**
   * Get the public tunnel URL from ngrok's local API
   * Ngrok runs a local API on port 4040 when started
   */
  private async getTunnelUrl(): Promise<string> {
    return new Promise((resolve, reject) => {
      http
        .get('http://localhost:4040/api/tunnels', (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const response = JSON.parse(data);
              const tunnel = response.tunnels?.find(
                (t: any) => t.proto === 'https',
              );
              const publicUrl = tunnel?.public_url;

              if (publicUrl) {
                resolve(publicUrl);
              } else {
                reject(new Error('No HTTPS tunnel found in ngrok API response'));
              }
            } catch (err) {
              reject(new Error(`Failed to parse ngrok API response: ${err}`));
            }
          });
        })
        .on('error', (err) => {
          reject(new Error(`Failed to connect to ngrok API: ${err.message}`));
        });
    });
  }

  /**
   * Register cleanup handlers to ensure ngrok process is killed
   * when the parent process exits
   */
  private registerCleanupHandlers(): void {
    // Handle Ctrl+C
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Shutting down ngrok tunnel...');
      this.cleanup();
      process.exit(0);
    });

    // Handle kill command
    process.on('SIGTERM', () => {
      this.cleanup();
      process.exit(0);
    });

    // Handle normal exit
    process.on('exit', () => {
      this.cleanup();
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('Uncaught exception:', err);
      this.cleanup();
      process.exit(1);
    });
  }

  /**
   * Kill the ngrok process gracefully
   */
  private cleanup(): void {
    if (this.process && !this.process.killed) {
      this.process.kill('SIGTERM'); // Graceful shutdown
      this.process = null;
    }
  }

  /**
   * Get ngrok web interface URL
   */
  getWebInterfaceUrl(): string {
    return 'http://localhost:4040';
  }
}
