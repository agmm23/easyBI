import os
import time
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY not found in .env")
    exit(1)

client = genai.Client(api_key=GEMINI_API_KEY)

print("--- Starting Model Connectivity Test ---")
print("Fetching available models...")

try:
    models = list(client.models.list())
except Exception as e:
    print(f"Error listing models: {e}")
    exit(1)

print(f"Found {len(models)} models. Testing generation capability...\n")

success_count = 0
results = []

for m in models:
    # Filter for 'generateContent' capable models (usually start with 'gemini')
    if "gemini" not in m.name and "learn" not in m.name: 
        continue
        
    print(f"Testing {m.name}...", end=" ", flush=True)
    
    try:
        response = client.models.generate_content(
            model=m.name,
            contents="Hello, are you working?"
        )
        print("✅ SUCCESS")
        results.append((m.name, "OK"))
        success_count += 1
        # Stop after finding a few working ones to save time/quota
        if success_count >= 3:
            print("\nFound 3 working models, stopping test early to save quota.")
            break
            
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg:
            print("⚠️ 429 (Rate Limit)")
            results.append((m.name, "429 Rate Limit"))
        elif "404" in error_msg:
            print("❌ 404 (Not Found/Supported)")
            results.append((m.name, "404 Not Found"))
        else:
            print(f"❌ Error: {error_msg[:50]}...")
            results.append((m.name, f"Error: {error_msg[:20]}..."))
    
    # Small delay to avoid triggering rate limits ourselves
    time.sleep(1)

print("\n--- Summary of Working Models ---")
working_models = [r[0] for r in results if r[1] == "OK"]
if working_models:
    for model in working_models:
        print(f"✅ {model}")
else:
    print("No models accepted the request. Check your billing/quota status.")

print("\n--- Detailed Results ---")
for name, status in results:
    print(f"{name}: {status}")
