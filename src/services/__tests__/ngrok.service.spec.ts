import { NgrokService } from "../ngrok.service";
import { spawn } from "child_process";
import { EventEmitter } from "events";

// Mock child_process
jest.mock("child_process");

describe("NgrokService", () => {
  let service: NgrokService;
  let mockSpawn: jest.MockedFunction<typeof spawn>;

  beforeEach(() => {
    service = new NgrokService();
    mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
    jest.clearAllMocks();
  });

  describe("isNgrokInstalled (cross-platform detection)", () => {
    it("should use 'which' command on Unix-like systems", async () => {
      // Save original platform
      const originalPlatform = process.platform;
      Object.defineProperty(process, "platform", {
        value: "darwin", // macOS
        configurable: true,
      });

      // Mock spawn to return success
      const mockProcess = new EventEmitter() as any;
      mockSpawn.mockReturnValue(mockProcess);

      // Start the check (don't await yet)
      const promise = (service as any).isNgrokInstalled();

      // Simulate successful command
      setTimeout(() => mockProcess.emit("close", 0), 10);

      const result = await promise;

      expect(mockSpawn).toHaveBeenCalledWith("which", ["ngrok"], {
        shell: false,
      });
      expect(result).toBe(true);

      // Restore original platform
      Object.defineProperty(process, "platform", {
        value: originalPlatform,
        configurable: true,
      });
    });

    it("should use 'where' command on Windows with shell option", async () => {
      // Save original platform
      const originalPlatform = process.platform;
      Object.defineProperty(process, "platform", {
        value: "win32", // Windows
        configurable: true,
      });

      // Mock spawn to return success
      const mockProcess = new EventEmitter() as any;
      mockSpawn.mockReturnValue(mockProcess);

      // Start the check (don't await yet)
      const promise = (service as any).isNgrokInstalled();

      // Simulate successful command (Windows 'where' returns 0 even with multiple results)
      setTimeout(() => mockProcess.emit("close", 0), 10);

      const result = await promise;

      expect(mockSpawn).toHaveBeenCalledWith("where", ["ngrok"], {
        shell: true,
      });
      expect(result).toBe(true);

      // Restore original platform
      Object.defineProperty(process, "platform", {
        value: originalPlatform,
        configurable: true,
      });
    });

    it("should return false when ngrok is not found (Unix)", async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, "platform", {
        value: "linux",
        configurable: true,
      });

      const mockProcess = new EventEmitter() as any;
      mockSpawn.mockReturnValue(mockProcess);

      const promise = (service as any).isNgrokInstalled();

      // Simulate command not found (exit code 1)
      setTimeout(() => mockProcess.emit("close", 1), 10);

      const result = await promise;

      expect(result).toBe(false);

      Object.defineProperty(process, "platform", {
        value: originalPlatform,
        configurable: true,
      });
    });

    it("should return false when ngrok is not found (Windows)", async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, "platform", {
        value: "win32",
        configurable: true,
      });

      const mockProcess = new EventEmitter() as any;
      mockSpawn.mockReturnValue(mockProcess);

      const promise = (service as any).isNgrokInstalled();

      // Simulate command not found (exit code 1)
      setTimeout(() => mockProcess.emit("close", 1), 10);

      const result = await promise;

      expect(result).toBe(false);

      Object.defineProperty(process, "platform", {
        value: originalPlatform,
        configurable: true,
      });
    });

    it("should handle spawn errors gracefully", async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, "platform", {
        value: "darwin",
        configurable: true,
      });

      const mockProcess = new EventEmitter() as any;
      mockSpawn.mockReturnValue(mockProcess);

      const promise = (service as any).isNgrokInstalled();

      // Simulate spawn error
      setTimeout(
        () => mockProcess.emit("error", new Error("Spawn failed")),
        10,
      );

      const result = await promise;

      expect(result).toBe(false);

      Object.defineProperty(process, "platform", {
        value: originalPlatform,
        configurable: true,
      });
    });
  });

  describe("Windows-specific behavior", () => {
    it("should handle Windows 'where' command returning multiple paths", async () => {
      // This test verifies that even if 'where' returns multiple paths
      // (as seen in the user's case with MSIX + npm installations),
      // we still correctly detect ngrok as installed (exit code 0)

      const originalPlatform = process.platform;
      Object.defineProperty(process, "platform", {
        value: "win32",
        configurable: true,
      });

      const mockProcess = new EventEmitter() as any;
      mockSpawn.mockReturnValue(mockProcess);

      const promise = (service as any).isNgrokInstalled();

      // Windows 'where' returns exit code 0 even with multiple results
      setTimeout(() => mockProcess.emit("close", 0), 10);

      const result = await promise;

      expect(result).toBe(true);
      expect(mockSpawn).toHaveBeenCalledWith("where", ["ngrok"], {
        shell: true,
      });

      Object.defineProperty(process, "platform", {
        value: originalPlatform,
        configurable: true,
      });
    });
  });
});
