import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

async function test() {
  console.log('Connecting to Kapruka MCP using official SDK...');
  
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  
  const customFetch = async (url, init) => {
    const headers = {};
    if (init.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((v, k) => { headers[k] = v; });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([k, v]) => { headers[k] = v; });
      } else {
        Object.assign(headers, init.headers);
      }
    }
    console.log(`\n[Fetch] URL: ${url} | Method: ${init.method}`);
    console.log('[Fetch] Headers:', headers);
    if (init.body) {
      console.log('[Fetch] Body:', init.body);
    }
    const res = await fetch(url, init);
    console.log(`[Fetch] Response status: ${res.status}`);
    return res;
  };

  const transport = new StreamableHTTPClientTransport(new URL('https://mcp.kapruka.com/mcp'), {
    fetch: customFetch,
    requestInit: {
      headers: {
        'User-Agent': userAgent
      }
    }
  });

  const client = new Client(
    { name: 'nelum-client', version: '1.0.0' },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log('Connected!');

  console.log('\nSearching for "flowers"...');
  const result = await client.callTool({
    name: 'kapruka_search_products',
    arguments: {
      params: { q: 'flowers', limit: 5 }
    }
  });
  console.log('Result for "flowers":', JSON.stringify(result, null, 2));

  console.log('Closing client...');
  await client.close();
}

test().catch(err => console.error('SDK Test Error:', err));
