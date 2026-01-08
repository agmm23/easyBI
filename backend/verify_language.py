
import sys
import os
import pandas as pd
from unittest.mock import patch
from fastapi.testclient import TestClient
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load env
load_dotenv("backend/.env")

# Patch dependencies
with patch("app.routers.ai.load_db") as mock_load_db, \
     patch("app.routers.ai.get_full_data") as mock_get_full_data:

    mock_load_db.return_value = [{"id": "test_ds", "path": "dummy_path"}]
    df = pd.DataFrame({'Ventas': [100, 200, 300], 'Producto': ['A', 'B', 'C']})
    mock_get_full_data.return_value = df

    from app.main import app
    client = TestClient(app)
    
    print("--- Starting Language Verification ---")
    
    # Test Spanish Query
    print("\nTest 1: Spanish Query ('Cuál es el total de Ventas?')")
    response_es = client.post("/api/ai/chat", json={
        "message": "Cuál es el total de Ventas?",
        "datasource_id": "test_ds"
    })
    
    print(f"Status: {response_es.status_code}")
    ans_es = response_es.json().get("response", "")
    print(f"Response: {ans_es}")
    
    # We can't strictly assert language detection without an NLP library, 
    # but we can check if the mock data (which has Spanish columns) is handled 
    # and if the response looks reasonable (e.g. contains '600').
    # Ideally, the AI should naturally reply in Spanish "El total de ventas es 600" or similar.
    # Since we are mocking the execution, the AI generates code -> code runs -> result is returned.
    # The result itself (number 600) is language agnostic, BUT the AI might wrap it in text if it fails to generate pure code
    # OR if the prompt rules say "return string or number".
    # Wait, the prompt says "return a string or number". 
    # If the function returns just a number (600), language doesn't matter much unless we want the AI to FORMAT the answer.
    # PROMPT SAYS: "DO NOT write usage examples, just the function definition."
    # AND "It must return a string or number (the answer)."
    
    # IF the AI generates code that returns a STRING, that string should be in Spanish.
    # e.g. return "El total es 600"
    
    # Let's see what happens.
    
    if "600" in str(ans_es):
        print("✅ SUCCESS: Correct calculation.")
    else:
        print("❌ FAILURE: Incorrect calculation.")

    # Test Unrelated Spanish Query
    print("\nTest 2: Unrelated Spanish Query ('Cuál es la capital de España?')")
    response_refusal = client.post("/api/ai/chat", json={
        "message": "Cuál es la capital de España?",
        "datasource_id": "test_ds"
    })
    
    ans_refusal = response_refusal.json().get("response", "")
    print(f"Response: {ans_refusal}")
    
    # We expect the translated refusal message.
    # The prompt says: output exact text "I can only answer... (Translated...)"
    # So we expect something like "Solo puedo responder preguntas sobre los datos de su empresa."
    
    if "España" in ans_refusal: 
        # If it answers "Madrid", it failed.
        print("❌ FAILURE: It answered the unrelated question.")
    elif "datos" in ans_refusal or "empresa" in ans_refusal:
         print("✅ SUCCESS: Refused in Spanish (likely).")
    else:
         print("⚠️ INDETERMINATE: Check response text.")

