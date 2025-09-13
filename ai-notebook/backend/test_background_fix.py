#!/usr/bin/env python3
"""Test script to verify background management fixes"""

import requests
import json

def test_background_api():
    """Test background management APIs"""
    base_url = "http://localhost:5000"
    
    print("Testing Background Management APIs...")
    print("=" * 50)
    
    # Test 1: Get all background files
    print("1. Testing GET /api/backgrounds")
    try:
        response = requests.get(f"{base_url}/api/backgrounds")
        if response.status_code == 200:
            files = response.json()
            print(f"   Success: Found {len(files)} background files")
            for file in files:
                print(f"   - {file['name']} (ID: {file['id']}, Theme: {file.get('theme', 'not set')})")
        else:
            print(f"   Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test 2: Get current background settings for both themes
    print("\n2. Testing GET /api/settings/background")
    for theme in ['light', 'dark']:
        try:
            response = requests.get(f"{base_url}/api/settings/background?theme={theme}")
            if response.status_code == 200:
                data = response.json()
                bg_id = data.get('backgroundId')
                if bg_id:
                    print(f"   {theme.title()} theme: {bg_id}")
                else:
                    print(f"   {theme.title()} theme: No background set")
            else:
                print(f"   {theme.title()} theme: Failed - {response.status_code}")
        except Exception as e:
            print(f"   {theme.title()} theme: Error - {e}")
    
    # Test 3: Test background settings sync endpoint
    print("\n3. Testing POST /api/backgrounds/sync")
    try:
        response = requests.post(f"{base_url}/api/backgrounds/sync")
        if response.status_code == 200:
            result = response.json()
            print(f"   Sync successful: {result.get('message', 'OK')}")
        else:
            print(f"   Sync failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   Sync error: {e}")
    
    # Test 4: Test background validation endpoint
    print("\n4. Testing GET /api/backgrounds/validate")
    try:
        response = requests.get(f"{base_url}/api/backgrounds/validate")
        if response.status_code == 200:
            result = response.json()
            validation = result.get('validation', {})
            print(f"   Validation result:")
            print(f"   - Consistent: {validation.get('is_consistent', False)}")
            print(f"   - DB count: {validation.get('db_count', 0)}")
            print(f"   - FS count: {validation.get('fs_count', 0)}")
            if validation.get('orphaned_records'):
                print(f"   - Orphaned: {len(validation['orphaned_records'])}")
            if validation.get('missing_records'):
                print(f"   - Missing: {len(validation['missing_records'])}")
        else:
            print(f"   Validation failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   Validation error: {e}")
    
    print("\n" + "=" * 50)
    print("API testing completed!")

if __name__ == "__main__":
    test_background_api()