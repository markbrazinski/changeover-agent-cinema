#!/usr/bin/env python3
"""
Curl Test Script for FastAPI Server.
Curling every endpoint in BOTH deterministic and real modes and printing raw JSON outputs.
"""
import requests
import json

BASE_URL = "http://localhost:8008"

def test_endpoint(method, endpoint, params=None):
    url = f"{BASE_URL}{endpoint}"
    print(f"\n=======================================================================")
    print(f"  {method} {url} | Params: {params}")
    print(f"=======================================================================")
    
    if method == "GET":
        res = requests.get(url, params=params)
    else:
        res = requests.post(url, params=params)
        
    print(f"HTTP Status: {res.status_code}")
    print("Raw JSON Response:")
    print(json.dumps(res.json(), indent=2))

def run_all_curl_tests():
    print("-----------------------------------------------------------------------")
    print("               PART 1: FASTAPI SERVER ENDPOINT PROOF                   ")
    print("-----------------------------------------------------------------------")

    # 1. /video/manifest
    test_endpoint("GET", "/video/manifest", {"mode": "deterministic"})
    test_endpoint("GET", "/video/manifest", {"mode": "real"})

    # 2. /demo/reset
    test_endpoint("POST", "/demo/reset", {"mode": "deterministic"})
    test_endpoint("POST", "/demo/reset", {"mode": "real"})

    # 3. /channel/inject-fault
    test_endpoint("POST", "/channel/inject-fault", {"channel": "tears_of_steel", "mode": "deterministic"})
    test_endpoint("POST", "/channel/inject-fault", {"channel": "tears_of_steel", "mode": "real"})

    # 4. /channel/investigate
    test_endpoint("GET", "/channel/investigate", {"channel": "tears_of_steel", "mode": "deterministic"})
    test_endpoint("GET", "/channel/investigate", {"channel": "tears_of_steel", "mode": "real"})

    # 5. /channel/verify-backup
    test_endpoint("GET", "/channel/verify-backup", {"channel": "tears_of_steel", "mode": "deterministic"})
    test_endpoint("GET", "/channel/verify-backup", {"channel": "tears_of_steel", "mode": "real"})

    # 6. /channel/authorize-failover
    test_endpoint("POST", "/channel/authorize-failover", {"channel": "tears_of_steel", "human_authorizer": "operator:mark", "mode": "deterministic"})
    test_endpoint("POST", "/channel/authorize-failover", {"channel": "tears_of_steel", "human_authorizer": "operator:mark", "mode": "real"})

    # 7. /channel/blind
    test_endpoint("GET", "/channel/blind", {"channel": "tears_of_steel", "mode": "deterministic"})
    test_endpoint("GET", "/channel/blind", {"channel": "tears_of_steel", "mode": "real"})

    # 8. /contention/run
    test_endpoint("POST", "/contention/run", {"human_authorizer": "operator:mark", "mode": "deterministic"})
    test_endpoint("POST", "/contention/run", {"human_authorizer": "operator:mark", "mode": "real"})

if __name__ == "__main__":
    run_all_curl_tests()
