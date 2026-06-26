/**
 * Nelum Express Server Configuration
 */
export const SERVER_CONFIG = {
  PORT: process.env.PORT || 8000,
  MCP_ENDPOINT: 'https://mcp.kapruka.com/mcp',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  GEMINI_VOICE_MODEL: process.env.GEMINI_VOICE_MODEL || 'gemini-2.0-flash',
  CACHE_TTLS: {
    DEFAULT: 86400,    // 24 hr
    SEARCH: 600,       // 10 min
    DELIVERY: 3600     // 1 hr
  }
};

export default SERVER_CONFIG;
