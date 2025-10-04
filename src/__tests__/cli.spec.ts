import { parseCliArgs, CliOptions } from '../cli';
import * as fs from 'fs';
import * as path from 'path';

describe('CLI Module', () => {
  // Store original process.argv
  const originalArgv = process.argv;

  afterEach(() => {
    // Restore original argv after each test
    process.argv = originalArgv;
  });

  describe('parseCliArgs', () => {
    it('should return default options when no arguments provided', () => {
      process.argv = ['node', 'ankimcp'];

      const options = parseCliArgs();

      expect(options).toEqual({
        port: 3000,
        host: '127.0.0.1',
        ankiConnect: 'http://localhost:8765',
      });
    });

    it('should parse custom port option', () => {
      process.argv = ['node', 'ankimcp', '--port', '8080'];

      const options = parseCliArgs();

      expect(options.port).toBe(8080);
      expect(options.host).toBe('127.0.0.1'); // defaults
      expect(options.ankiConnect).toBe('http://localhost:8765'); // defaults
    });

    it('should parse short form port option', () => {
      process.argv = ['node', 'ankimcp', '-p', '9000'];

      const options = parseCliArgs();

      expect(options.port).toBe(9000);
    });

    it('should parse custom host option', () => {
      process.argv = ['node', 'ankimcp', '--host', '0.0.0.0'];

      const options = parseCliArgs();

      expect(options.host).toBe('0.0.0.0');
      expect(options.port).toBe(3000); // defaults
      expect(options.ankiConnect).toBe('http://localhost:8765'); // defaults
    });

    it('should parse short form host option', () => {
      process.argv = ['node', 'ankimcp', '-h', '192.168.1.100'];

      const options = parseCliArgs();

      expect(options.host).toBe('192.168.1.100');
    });

    it('should parse custom anki-connect URL', () => {
      process.argv = [
        'node',
        'ankimcp',
        '--anki-connect',
        'http://192.168.1.50:8765',
      ];

      const options = parseCliArgs();

      expect(options.ankiConnect).toBe('http://192.168.1.50:8765');
      expect(options.port).toBe(3000); // defaults
      expect(options.host).toBe('127.0.0.1'); // defaults
    });

    it('should parse short form anki-connect option', () => {
      process.argv = ['node', 'ankimcp', '-a', 'http://example.com:8765'];

      const options = parseCliArgs();

      expect(options.ankiConnect).toBe('http://example.com:8765');
    });

    it('should parse all options together', () => {
      process.argv = [
        'node',
        'ankimcp',
        '--port',
        '4000',
        '--host',
        '0.0.0.0',
        '--anki-connect',
        'http://custom-host:9999',
      ];

      const options = parseCliArgs();

      expect(options).toEqual({
        port: 4000,
        host: '0.0.0.0',
        ankiConnect: 'http://custom-host:9999',
      });
    });

    it('should convert port string to number', () => {
      process.argv = ['node', 'ankimcp', '--port', '8080'];

      const options = parseCliArgs();

      expect(typeof options.port).toBe('number');
      expect(options.port).toBe(8080);
    });

    it('should handle numeric port values', () => {
      process.argv = ['node', 'ankimcp', '--port', '3000'];

      const options = parseCliArgs();

      expect(options.port).toBe(3000);
    });
  });

  describe('getVersion', () => {
    it('should read version from package.json', () => {
      // This test verifies that the version can be read from package.json
      const packageJsonPath = path.join(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      // Verify package.json has a version
      expect(packageJson.version).toBeDefined();
      expect(typeof packageJson.version).toBe('string');
      expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('should handle --version flag', () => {
      process.argv = ['node', 'ankimcp', '--version'];

      const writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
      const exitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation((() => {
          throw new Error(`process.exit called`);
        }) as never);

      try {
        parseCliArgs();
      } catch (e) {
        // Commander exits on --version
      }

      const packageJsonPath = path.join(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      // Check that version was written to stdout
      const output = writeSpy.mock.calls.map((call) => call[0]).join('');
      expect(output).toContain(packageJson.version);

      writeSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });

  describe('displayStartupBanner', () => {
    it('should display startup banner with correct information', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const options: CliOptions = {
        port: 3000,
        host: '127.0.0.1',
        ankiConnect: 'http://localhost:8765',
      };

      const { displayStartupBanner } = require('../cli');
      displayStartupBanner(options);

      const output = consoleLogSpy.mock.calls.map((call) => call[0]).join('\n');

      expect(output).toContain('AnkiMCP HTTP Server');
      expect(output).toContain('http://127.0.0.1:3000');
      expect(output).toContain('http://localhost:8765');
      expect(output).toContain('Port:');
      expect(output).toContain('3000');
      expect(output).toContain('Host:');
      expect(output).toContain('127.0.0.1');

      consoleLogSpy.mockRestore();
    });

    it('should display custom options in banner', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const options: CliOptions = {
        port: 8080,
        host: '0.0.0.0',
        ankiConnect: 'http://192.168.1.100:8765',
      };

      const { displayStartupBanner } = require('../cli');
      displayStartupBanner(options);

      const output = consoleLogSpy.mock.calls.map((call) => call[0]).join('\n');

      expect(output).toContain('http://0.0.0.0:8080');
      expect(output).toContain('http://192.168.1.100:8765');
      expect(output).toContain('8080');
      expect(output).toContain('0.0.0.0');

      consoleLogSpy.mockRestore();
    });

    it('should include ngrok usage instructions', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const options: CliOptions = {
        port: 3000,
        host: '127.0.0.1',
        ankiConnect: 'http://localhost:8765',
      };

      const { displayStartupBanner } = require('../cli');
      displayStartupBanner(options);

      const output = consoleLogSpy.mock.calls.map((call) => call[0]).join('\n');

      expect(output).toContain('ngrok');
      expect(output).toContain('ngrok http 3000');

      consoleLogSpy.mockRestore();
    });

    it('should show correct ngrok port in instructions', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const options: CliOptions = {
        port: 8080,
        host: '127.0.0.1',
        ankiConnect: 'http://localhost:8765',
      };

      const { displayStartupBanner } = require('../cli');
      displayStartupBanner(options);

      const output = consoleLogSpy.mock.calls.map((call) => call[0]).join('\n');

      expect(output).toContain('ngrok http 8080');

      consoleLogSpy.mockRestore();
    });

    it('should include help command reference', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      const options: CliOptions = {
        port: 3000,
        host: '127.0.0.1',
        ankiConnect: 'http://localhost:8765',
      };

      const { displayStartupBanner } = require('../cli');
      displayStartupBanner(options);

      const output = consoleLogSpy.mock.calls.map((call) => call[0]).join('\n');

      expect(output).toContain('ankimcp --help');

      consoleLogSpy.mockRestore();
    });
  });
});
