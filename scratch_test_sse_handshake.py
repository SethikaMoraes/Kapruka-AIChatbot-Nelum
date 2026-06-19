import urllib.request
import urllib.error
import json
import threading
import time

url = "https://mcp.kapruka.com/mcp"
headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

# Use a list to share the session ID and stream state
session_id_holder = []
sse_connected = threading.Event()
message_received = threading.Event()

def read_sse_stream():
    session_id = session_id_holder[0]
    sse_headers = {
        'Accept': 'text/event-stream',
        'Mcp-Session-Id': session_id,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    print(f"[SSE Thread] Connecting to SSE GET stream for session {session_id}...")
    req = urllib.request.Request(url, headers=sse_headers, method='GET')
    try:
        with urllib.request.urlopen(req) as resp:
            print("[SSE Thread] GET stream connected!")
            sse_connected.set()
            while True:
                line = resp.readline().decode('utf-8')
                if not line:
                    print("[SSE Thread] Connection closed by server.")
                    break
                line = line.strip()
                if line:
                    print("[SSE Thread] Received:", line)
                    if "tools/list" in line or "result" in line or '"id":2' in line:
                        message_received.set()
    except Exception as e:
        print("[SSE Thread] Error:", e)

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

try:
    print("1. Sending initialize POST request...")
    req_init = urllib.request.Request(url, data=json.dumps(init_payload).encode('utf-8'), headers=headers)
    with urllib.request.urlopen(req_init) as response:
        session_id = dict(response.headers).get('mcp-session-id')
        print("Initialize Status:", response.status)
        print("Initialize Body:", response.read().decode('utf-8'))
        
    if not session_id:
        print("Failed to get session ID.")
        exit(1)
        
    session_id_holder.append(session_id)
    
    # Start SSE reader thread
    t = threading.Thread(target=read_sse_stream, daemon=True)
    t.start()
    
    # Wait for SSE to connect
    print("Waiting for SSE thread to connect...")
    if not sse_connected.wait(timeout=10.0):
        print("Timeout waiting for SSE connection.")
        exit(1)
        
    # Send initialized notification
    time.sleep(1)
    print("\n2. Sending initialized notification...")
    notif_payload = {
        "jsonrpc": "2.0",
        "method": "notifications/initialized"
    }
    req_notif = urllib.request.Request(
        url,
        data=json.dumps(notif_payload).encode('utf-8'),
        headers={**headers, 'Mcp-Session-Id': session_id}
    )
    with urllib.request.urlopen(req_notif) as response:
        print("Notification response status:", response.status)
        print("Notification response body:", response.read().decode('utf-8'))
        
    # 3. Call tools/list
    time.sleep(1)
    print("\n3. Sending tools/list request...")
    list_payload = {
        "jsonrpc": "2.0",
        "method": "tools/list",
        "params": {},
        "id": 2
    }
    req_list = urllib.request.Request(
        url,
        data=json.dumps(list_payload).encode('utf-8'),
        headers={**headers, 'Mcp-Session-Id': session_id}
    )
    with urllib.request.urlopen(req_list) as response:
        print("POST tools/list response status:", response.status)
        print("POST tools/list response body:", response.read().decode('utf-8'))
        
    print("Waiting for response on SSE stream...")
    if message_received.wait(timeout=10.0):
        print("Success! Message received on SSE stream.")
    else:
        print("Timeout waiting for message on SSE stream.")
        
except Exception as e:
    print("Main Error:", e)
