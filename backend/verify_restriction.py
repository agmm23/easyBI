
import sys
import os
import pandas as pd
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# Add current directory to path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Mock dependencies BEFORE importing app/routers that might use them
# We need to mock app.routers.ai.load_db and app.routers.ai.get_full_data
# But since we import app.main, which imports app.routers.ai, we need to patch specifically where they are used.
from dotenv import load_dotenv
load_dotenv("backend/.env")

# It is easier to patch them in `app.routers.ai` namespace.
with patch("app.routers.ai.load_db") as mock_load_db, \
     patch("app.routers.ai.get_full_data") as mock_get_full_data:

    # Setup Mocks
    mock_load_db.return_value = [{"id": "test_ds", "path": "dummy_path"}]
    
    # Create a simple dataframe
    df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
    mock_get_full_data.return_value = df

    # Import app AFTER mocks are ready (though we are patching the module usage, so it can be imported before potentially, but safe here)
    from app.main import app
    
    client = TestClient(app)
    
    print("--- Starting AI Restriction Verification ---")
    
    # 1. Test Unrelated Query
    print("\nTest 1: Unrelated Query ('What is the capital of France?')")
    response = client.post("/api/ai/chat", json={
        "message": "What is the capital of France?",
        "datasource_id": "test_ds"
    })
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
    res_text = response.json().get("response", "")
    if "I can only answer questions about your company data" in res_text:
        print("✅ SUCCESS: AI refused unrelated query.")
    else:
        print("❌ FAILURE: AI did not refuse unrelated query.")

    # 2. Test Related Query
    print("\nTest 2: Related Query ('What is the sum of column A?')")
    response_valid = client.post("/api/ai/chat", json={
        "message": "What is the sum of column A?",
        "datasource_id": "test_ds"
    })
    
    print(f"Status Code: {response_valid.status_code}")
    print(f"Response: {response_valid.json()}")
    
    res_valid_text = response_valid.json().get("response", "")
    # We expect a number or string answer, NOT the refusal
    if "I can only answer questions about your company data" not in res_valid_text and response_valid.status_code == 200:
         print("✅ SUCCESS: AI answered related query.")
    else:
         print("❌ FAILURE: AI refused or failed related query.")

