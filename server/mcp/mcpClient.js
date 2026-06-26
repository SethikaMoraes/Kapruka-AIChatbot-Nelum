/**
 * Nelum Express Model Context Protocol (MCP) Client
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SERVER_CONFIG } from '../config/server.config.js';

let mcpClient = null;
let mcpTransport = null;

async function getMcpClient() {
  if (mcpClient) {
    return mcpClient;
  }

  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  
  mcpTransport = new StreamableHTTPClientTransport(new URL(SERVER_CONFIG.MCP_ENDPOINT), {
    requestInit: {
      headers: {
        'User-Agent': userAgent
      }
    }
  });

  const client = new Client(
    { name: 'nelum-server', version: '1.0.0' },
    { capabilities: {} }
  );

  console.log(`[Backend MCP] Connecting to Kapruka MCP using official SDK client...`);
  await client.connect(mcpTransport);
  console.log(`[Backend MCP] Stateful session established.`);
  mcpClient = client;
  return mcpClient;
}

export const mcpClientWrapper = {
  /**
   * Calls a registered MCP tool.
   * @param {string} toolName 
   * @param {object} params 
   * @returns {Promise<string>} Tool response text
   */
  async callTool(toolName, params) {
    let client = await getMcpClient();
    try {
      const response = await client.callTool({
        name: toolName,
        arguments: {
          params: params
        }
      });

      if (response.isError) {
        const errMsg = response.content && response.content[0] ? response.content[0].text : 'Unknown tool error';
        throw new Error(errMsg);
      }

      return response.content && response.content[0] ? response.content[0].text : '';
    } catch (error) {
      console.warn(`[Backend MCP] Error calling tool "${toolName}": ${error.message}. Reconnecting...`);
      mcpClient = null;
      try {
        if (client) {
          await client.close().catch(() => {});
        }
      } catch (_) {}

      // Retry once
      client = await getMcpClient();
      const response = await client.callTool({
        name: toolName,
        arguments: {
          params: params
        }
      });

      if (response.isError) {
        const errMsg = response.content && response.content[0] ? response.content[0].text : 'Unknown tool error';
        throw new Error(errMsg);
      }

      return response.content && response.content[0] ? response.content[0].text : '';
    }
  }
};

export default mcpClientWrapper;
