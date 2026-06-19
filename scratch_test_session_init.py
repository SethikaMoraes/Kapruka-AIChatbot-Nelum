import urllib.request
import json
import uuid

url = "https://mcp.kapruka.com/mcp"
session_id = str(uuid.uuid4())
print("Generated Session ID:", session_id)

payload = {
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": {
            "name": "nelum-client",
            "version": "1.0.0"
        }
    },
    "id": 1
}

req = urllib.request.Request(
    url,
    data=json.dumps(payload).encode('utf-8'),
    headers={
        'Content-Type': 'application/json',
        'Mcp-Session-Id': session_id,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
)

try:
    print("Sending initialize request with Mcp-Session-Id header...")
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Headers:", dict(response.headers))
        print("Body:", response.read().decode('utf-8'))
except Exception as e:
    # Print error response body if available
    if hasattr(e, 'read'):
        print("Error Response Body:", e.read().decode('utf-8'))
    print("Error:", e)
