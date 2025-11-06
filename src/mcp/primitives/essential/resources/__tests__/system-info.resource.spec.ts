import { SystemInfoResource } from "../system-info.resource";

describe("SystemInfoResource", () => {
  let resource: SystemInfoResource;

  beforeEach(() => {
    resource = new SystemInfoResource();
  });

  describe("getSystemInfo", () => {
    it("should return formatted system information", () => {
      const uri = "system://info";
      const result = resource.getSystemInfo({ uri });

      expect(result).toHaveProperty("contents");
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0]).toHaveProperty("uri");
      expect(result.contents[0].uri).toBe(uri);
      expect(result.contents[0]).toHaveProperty("mimeType");
      expect(result.contents[0].mimeType).toBe("application/json");
      expect(result.contents[0]).toHaveProperty("text");
    });

    it("should return valid JSON", () => {
      const result = resource.getSystemInfo({ uri: "system://info" });
      const text = result.contents[0].text;

      expect(() => JSON.parse(text)).not.toThrow();
    });

    it("should include all required system information fields", () => {
      const result = resource.getSystemInfo({ uri: "system://info" });
      const data = JSON.parse(result.contents[0].text);

      expect(data).toHaveProperty("platform");
      expect(data).toHaveProperty("release");
      expect(data).toHaveProperty("type");
      expect(data).toHaveProperty("arch");
      expect(data).toHaveProperty("cpus");
      expect(data).toHaveProperty("totalMemory");
      expect(data).toHaveProperty("freeMemory");
      expect(data).toHaveProperty("uptime");
      expect(data).toHaveProperty("hostname");
      expect(data).toHaveProperty("nodeVersion");
      expect(data).toHaveProperty("env");
    });

    it("should format memory as GB", () => {
      const result = resource.getSystemInfo({ uri: "system://info" });
      const data = JSON.parse(result.contents[0].text);

      expect(data.totalMemory).toMatch(/^\d+ GB$/);
      expect(data.freeMemory).toMatch(/^\d+ GB$/);
    });

    it("should format uptime as hours", () => {
      const result = resource.getSystemInfo({ uri: "system://info" });
      const data = JSON.parse(result.contents[0].text);

      expect(data.uptime).toMatch(/^\d+ hours$/);
    });

    it("should include CPU count as number", () => {
      const result = resource.getSystemInfo({ uri: "system://info" });
      const data = JSON.parse(result.contents[0].text);

      expect(typeof data.cpus).toBe("number");
      expect(data.cpus).toBeGreaterThan(0);
    });

    it("should include NODE_ENV in environment", () => {
      const result = resource.getSystemInfo({ uri: "system://info" });
      const data = JSON.parse(result.contents[0].text);

      expect(data.env).toHaveProperty("NODE_ENV");
      expect(typeof data.env.NODE_ENV).toBe("string");
    });

    it("should default NODE_ENV to development when not set", () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;

      const result = resource.getSystemInfo({ uri: "system://info" });
      const data = JSON.parse(result.contents[0].text);

      expect(data.env.NODE_ENV).toBe("development");

      // Restore
      if (originalEnv !== undefined) {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it("should include Node.js version", () => {
      const result = resource.getSystemInfo({ uri: "system://info" });
      const data = JSON.parse(result.contents[0].text);

      expect(data.nodeVersion).toBe(process.version);
      expect(data.nodeVersion).toMatch(/^v\d+\.\d+\.\d+/);
    });

    it("should handle different URI values", () => {
      const uri1 = "system://info";
      const uri2 = "custom://path";

      const result1 = resource.getSystemInfo({ uri: uri1 });
      const result2 = resource.getSystemInfo({ uri: uri2 });

      expect(result1.contents[0].uri).toBe(uri1);
      expect(result2.contents[0].uri).toBe(uri2);
    });
  });

  describe("getEnvironmentVariable", () => {
    afterEach(() => {
      // Clean up test env vars
      delete process.env.TEST_VAR;
      delete process.env.ANOTHER_TEST_VAR;
      delete process.env.EMPTY_VAR;
      delete process.env.SPECIAL_VAR;
      delete process.env.LONG_VAR;
      delete process.env.NUMERIC_VAR;
    });

    it("should return existing environment variable", () => {
      process.env.TEST_VAR = "test-value";

      const result = resource.getEnvironmentVariable({
        uri: "env://test_var",
        name: "test_var",
      });

      expect(result).toHaveProperty("contents");
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].text).toBe("test-value");
    });

    it("should return correct mimeType for environment variables", () => {
      process.env.TEST_VAR = "test-value";

      const result = resource.getEnvironmentVariable({
        uri: "env://test_var",
        name: "test_var",
      });

      expect(result.contents[0].mimeType).toBe("text/plain");
    });

    it('should return "undefined" for missing environment variable', () => {
      const result = resource.getEnvironmentVariable({
        uri: "env://nonexistent",
        name: "nonexistent",
      });

      expect(result.contents[0].text).toBe("undefined");
    });

    it("should handle case-insensitive variable names (uppercase conversion)", () => {
      process.env.TEST_VAR = "test-value";

      const result = resource.getEnvironmentVariable({
        uri: "env://test_var",
        name: "test_var", // lowercase input
      });

      expect(result.contents[0].text).toBe("test-value");
    });

    it("should handle uppercase variable names", () => {
      process.env.ANOTHER_TEST_VAR = "another-value";

      const result = resource.getEnvironmentVariable({
        uri: "env://another_test_var",
        name: "ANOTHER_TEST_VAR", // uppercase input
      });

      expect(result.contents[0].text).toBe("another-value");
    });

    it("should return correct URI in response", () => {
      process.env.TEST_VAR = "test-value";
      const uri = "env://test_var";

      const result = resource.getEnvironmentVariable({
        uri,
        name: "test_var",
      });

      expect(result.contents[0].uri).toBe(uri);
    });

    it("should return 'undefined' for empty string environment variable", () => {
      process.env.EMPTY_VAR = "";

      const result = resource.getEnvironmentVariable({
        uri: "env://empty_var",
        name: "empty_var",
      });

      // Note: The implementation treats empty string as falsy and returns "undefined"
      expect(result.contents[0].text).toBe("undefined");
    });

    it("should handle environment variables with special characters", () => {
      process.env.SPECIAL_VAR = "value with spaces and symbols: !@#$%";

      const result = resource.getEnvironmentVariable({
        uri: "env://special_var",
        name: "special_var",
      });

      expect(result.contents[0].text).toBe(
        "value with spaces and symbols: !@#$%",
      );
    });

    it("should handle very long environment variable values", () => {
      const longValue = "x".repeat(10000);
      process.env.LONG_VAR = longValue;

      const result = resource.getEnvironmentVariable({
        uri: "env://long_var",
        name: "long_var",
      });

      expect(result.contents[0].text).toBe(longValue);
      expect(result.contents[0].text.length).toBe(10000);
    });

    it("should handle numeric environment variable values", () => {
      process.env.NUMERIC_VAR = "12345";

      const result = resource.getEnvironmentVariable({
        uri: "env://numeric_var",
        name: "numeric_var",
      });

      expect(result.contents[0].text).toBe("12345");
    });
  });
});
