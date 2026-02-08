
import requests
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
import re

def test_fuzzing_logic(target_url, payload, patterns):
    print(f"Testing URL: {target_url}")
    print(f"Payload: {payload}")
    
    # 1. Parse URL logic from fuzzing_worker.py
    parsed_url = urlparse(target_url)
    base_params = parse_qs(parsed_url.query, keep_blank_values=True) if parsed_url.query else {}
    
    print(f"Parsed Params: {base_params}")
    
    if not base_params:
        # Simulate fallback to path injection?
        print("No params found, skipping parameter injection logic check (unless expected).")
        # In fuzzing_worker, if no params, it tries path injection.
        # But for ...?q=, base_params SHOULD be {'q': ['']}
        if 'q=' in target_url and not base_params:
             print("CRITICAL: 'q=' was present but parse_qs returned empty!")
    
    # 2. Inject payload logic
    for param_name in base_params.keys():
        print(f"Injecting into param: {param_name}")
        test_params = base_params.copy()
        test_params[param_name] = [payload]
        
        # 3. Rebuild URL logic
        new_query = urlencode(test_params, doseq=True)
        test_url = urlunparse((
            parsed_url.scheme,
            parsed_url.netloc,
            parsed_url.path,
            parsed_url.params,
            new_query,
            parsed_url.fragment
        ))
        
        print(f"Constructed URL: {test_url}")
        
        # 4. Send Request logic
        try:
            response = requests.get(test_url, timeout=10)
            print(f"Response Status: {response.status_code}")
            print(f"Response Body (first 200 chars): {response.text[:200]}")
            
            # 5. Detection logic
            for pattern in patterns:
                if re.search(pattern, response.text, re.IGNORECASE):
                    print(f"SUCCESS! Vulnerability detected with pattern: {pattern}")
                    return True
            print("FAILURE: No vulnerability detected.")
        except Exception as e:
            print(f"Request failed: {e}")

    return False

if __name__ == "__main__":
    target = "http://localhost:3000/rest/products/search?q="
    # The payload that works via curl is qwert'))
    # The payload in the list is '))
    
    # Test 1: Exact payload from payloads list
    payload_1 = "'))"
    detection_pattern = r"SQLITE_ERROR"
    
    print("--- TEST 1: Payload '))' (Standard) ---")
    test_fuzzing_logic(target, payload_1, [detection_pattern])

    # Test 2: Payload qwert')) (like curl)
    payload_2 = "qwert'))"
    print("\n--- TEST 2: Payload 'qwert'))' (Hybrid) ---")
    test_fuzzing_logic(target, payload_2, [detection_pattern])
