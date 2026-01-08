from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google import genai
from google.genai import types
import os
import io
import pandas as pd
from typing import Optional
from app.services.data_processing import get_full_data
from app.routers.datasources import load_db

router = APIRouter(
    prefix="/api/ai",
    tags=["ai"]
)

# Configure Gemini Client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

class ChatRequest(BaseModel):
    message: str
    datasource_id: str

@router.post("/chat")
async def chat_with_data(request: ChatRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")

    # 1. Load Datasource Info
    db = load_db()
    ds = next((d for d in db if d["id"] == request.datasource_id), None)
    if not ds:
        raise HTTPException(status_code=404, detail="Datasource not found")

    # 2. Load Data
    try:
        df = get_full_data(ds["path"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading data: {str(e)}")

    # 3. Prepare Context
    # Optimization: Provide Schema and Sample, ask for Code.
    
    # Simple Schema for Code Generation
    buffer = io.StringIO()
    df.info(buf=buffer)
    df_info = buffer.getvalue()
    
    # Sample Data
    sample = df.head(3).to_string()
    
    prompt = f"""
    You are an expert Python Data Analyst.
    
    User Query: "{request.message}"
    
    Dataset Info:
    {df_info}
    
    Sample Data:
    {sample}
    
    Goal:
    Write a Python function named `analyze(df)` that takes the pandas DataFrame `df` as input and returns the answer to the user's query.
    
    Rules:
    - The function must be named `analyze`.
    - It must accept `df` as a parameter.
    - It must return a string or number (the answer).
    - Handle date columns assuming they might be strings (convert with pd.to_datetime if needed).
    - DO NOT write usage examples, just the function definition.
    - Use standard pandas operations.
    - CRITICAL: If the User Query is NOT related to the provided Dataset Info or data analysis, DO NOT generate any code. Instead, just output the exact text: "I can only answer questions about your company data." (Translated to the language of the User Query).
    - ANSWER in the same language as the User Query.
    """

    # 4. Call Model to Generate Code
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt
        )
        ai_response_text = response.text
        
        # Capture Token Usage
        usage = getattr(response, "usage_metadata", None)
        token_stats = {
            "prompt_tokens": usage.prompt_token_count if usage else 0,
            "candidates_tokens": usage.candidates_token_count if usage else 0,
            "total_tokens": usage.total_token_count if usage else 0
        }
        
        # 5. Extract and Execute Code
        import re
        
        # Extract code block if wrapped in markdown
        code_match = re.search(r"```python(.*?)```", ai_response_text, re.DOTALL)
        if code_match:
            code_str = code_match.group(1).strip()
        else:
            # Fallback: assume the whole text is code if no blocks found (risky but handled by try/except)
            code_str = ai_response_text.strip()
            # If it starts with 'def ', good.
            if not code_str.startswith("def"):
                 # It might be chatting instead of coding.
                 return {"response": ai_response_text}

        # Execution Environment
        local_scope = {}
        
        execution_error = None
        result = None
        
        try:
            # Execute the function definition
            exec(code_str, {"pd": pd}, local_scope)
            
            # Check if function exists
            if "analyze" not in local_scope:
                execution_error = "Error: AI did not generate a valid 'analyze' function."
                return {"response": execution_error}
            
            # Run the function
            result = local_scope["analyze"](df)
            
            # Log the successful interaction
            log_interaction(request.message, prompt, code_str, str(result), token_stats=token_stats)
            
            return {"response": str(result)}
            
        except Exception as exec_error:
            execution_error = str(exec_error)
            print(f"Code Execution Error: {exec_error}")
            
            # Log the failed interaction
            log_interaction(request.message, prompt, code_str, None, error=execution_error, token_stats=token_stats)
            
            return {"response": f"I tried to calculate that but got an error: {execution_error}"}
            
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
             import re
             wait_time = "30 seconds"
             match = re.search(r"'retryDelay': '([\d\.]+)s'", error_msg)
             if match:
                 wait_time = f"{int(float(match.group(1)))} seconds"
             
             raise HTTPException(status_code=429, detail=f"AI Busy: Quota exceeded. Please wait {wait_time} and try again.")
        print(f"AI Error: {error_msg}")
        raise HTTPException(status_code=500, detail=f"AI Error: {error_msg}")

import datetime

def log_interaction(query, prompt, code, response, error=None, token_stats=None):
    """
    Logs the AI interaction to a file for debugging, including token usage.
    """
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    tokens_str = "N/A"
    if token_stats:
        tokens_str = (f"Prompt: {token_stats.get('prompt_tokens', 0)} | "
                      f"Response: {token_stats.get('candidates_tokens', 0)} | "
                      f"Total: {token_stats.get('total_tokens', 0)}")
                      
    log_entry = f"""
================================================================================
TIMESTAMP: {timestamp}
QUERY: {query}
TOKENS: {tokens_str}
--------------------------------------------------------------------------------
PROMPT SENT:
{prompt}
--------------------------------------------------------------------------------
GENERATED CODE:
{code}
--------------------------------------------------------------------------------
RESULT: {response if response else 'N/A'}
ERROR: {error if error else 'None'}
================================================================================
"""
    try:
        with open("ai_debug.log", "a", encoding="utf-8") as f:
            f.write(log_entry)
    except Exception as e:
        print(f"Failed to write to log: {e}")
