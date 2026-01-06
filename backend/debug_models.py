from google import genai
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("API Key not found!")
    exit()

print(f"Using key: {api_key[:5]}...")

try:
    client = genai.Client(api_key=api_key)
    print("Listing available models:")
    # The new SDK might allow iteration directly or return a page
    models = client.models.list()
    for m in models:
        # The object might have .name or .display_name
        print(f"- {m.name}")
except Exception as e:
    print(f"Error listing models: {e}")
