/**
 * MCPB Workarounds
 *
 * This file contains workarounds for known MCPB (Model Context Protocol Bundle) issues.
 * These should be removed once the underlying issues are fixed in the MCPB implementation.
 */

/**
 * Workaround for MCPB variable substitution issue where optional user_config values
 * are passed as literal strings like "${user_config.key_name}" instead of being
 * substituted or omitted.
 *
 * GitHub Issue: Not yet reported (discovered 2025-09-30)
 *
 * This function detects if a value is a literal MCPB variable string and returns
 * undefined to prevent it from being used as an actual value.
 *
 * @param value - The configuration value to sanitize
 * @returns The value if valid, undefined if it's a literal MCPB variable
 *
 * @example
 * sanitizeMcpbConfigValue("${user_config.api_key}") // returns undefined
 * sanitizeMcpbConfigValue("actual-api-key") // returns "actual-api-key"
 * sanitizeMcpbConfigValue("") // returns undefined
 * sanitizeMcpbConfigValue(undefined) // returns undefined
 */
export function sanitizeMcpbConfigValue(value: string | undefined): string | undefined {
  if (!value || value.trim() === '') {
    return undefined;
  }

  // Check if value is a literal MCPB variable that wasn't substituted
  if (value.startsWith('${') && value.endsWith('}')) {
    return undefined;
  }

  return value;
}
