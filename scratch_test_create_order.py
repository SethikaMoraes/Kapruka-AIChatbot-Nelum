import urllib.request
import json

url = "https://mcp.kapruka.com/mcp"
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

# 1. Initialize
init_payload = {
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

req_init = urllib.request.Request(url, data=json.dumps(init_payload).encode('utf-8'), headers=headers)

try:
    with urllib.request.urlopen(req_init) as response:
        session_id = dict(response.headers).get('mcp-session-id')
        
    if not session_id:
        print("No session ID.")
        exit(1)
        
    # 2. Call create order tool with updated params
    tool_payload = {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": "kapruka_create_order",
            "arguments": {
                "params": {
                    "cart": [
                        {
                            "product_id": "FLOWERS00T1603"
                        }
                    ],
                    "recipient": {
                        "name": "Priyantha Silva",
                        "phone": "0771234567"
                    },
                    "delivery": {
                        "city": "Colombo 03",
                        "date": "2026-06-18",
                        "address": "No. 23, Flower Road, Colombo 03"
                    },
                    "sender": {
                        "name": "Sethika Moraes"
                    },
                    "gift_message": "Happy Birthday Amma!",
                    "currency": "LKR"
                }
            }
        },
        "id": 2
    }
    
    tool_headers = headers.copy()
    tool_headers['Mcp-Session-Id'] = session_id
    
    req_tool = urllib.request.Request(url, data=json.dumps(tool_payload).encode('utf-8'), headers=tool_headers)
    
    print("Creating guest order with corrected params...")
    with urllib.request.urlopen(req_tool) as response:
        body = response.read().decode('utf-8')
        print("Body:", body)
        
except Exception as e:
    if hasattr(e, 'read'):
        print("Error Body:", e.read().decode('utf-8'))
    print("Error:", e)
