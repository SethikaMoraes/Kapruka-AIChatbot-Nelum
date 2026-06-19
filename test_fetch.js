const url = 'https://mcp.kapruka.com/mcp';
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function run() {
  console.log('1. Initializing session...');
  const initRes = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'User-Agent': userAgent
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: 'nelum-client', version: '1.0.0' }
      },
      id: 1
    })
  });
  const sessionId = initRes.headers.get('mcp-session-id');
  console.log('Negotiated Session ID:', sessionId);

  console.log('\n2. Calling kapruka_search_products for "flowers"...');
  const searchRes = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Mcp-Session-Id': sessionId,
      'User-Agent': userAgent
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'kapruka_search_products',
        arguments: {
          params: { q: 'flowers', limit: 5 }
        }
      },
      id: 2
    })
  });
  console.log('Search Status:', searchRes.status);
  console.log('Search Body:', await searchRes.text());
}
run();
