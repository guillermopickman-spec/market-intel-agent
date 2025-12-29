import os
import requests
import time
from typing import List

class RemoteEmbedder:
    def __init__(self):
        # Using the standard Inference API URL for the model 
        self.api_url = "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2"
        self.headers = {"Authorization": f"Bearer {os.getenv('HF_API_TOKEN')}"}

    def embed(self, texts: List[str]):
        # The Hugging Face Feature Extraction pipeline expects a simple list or a specific dict 
        payload = {
            "inputs": texts,
            "options": {"wait_for_model": True}  # Tells HF to wait for the model to load 
        }

        for attempt in range(3):
            try:
                response = requests.post(self.api_url, headers=self.headers, json=payload)
                result = response.json()
                
                # Handle model loading state 
                if isinstance(result, dict) and "estimated_time" in result:
                    wait_time = result.get("estimated_time", 5)
                    print(f"⏳ Model is warming up on Hugging Face, waiting {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                
                # Check for other API errors [cite: 19]
                if isinstance(result, dict) and "error" in result:
                    print(f"⚠️ API Warning: {result.get('error')}")
                    # If it complains about 'sentences', try the alternative format
                    if "sentences" in str(result):
                        response = requests.post(self.api_url, headers=self.headers, json={"inputs": {"sentences": texts}})
                        return response.json()
                
                return result
                
            except Exception as e:
                print(f"🔄 Retry {attempt + 1}/3 due to connection error: {e}")
                time.sleep(1)
        
        raise Exception(f"HF API Error: {result}")

_model = None

def get_embedding_model():
    global _model
    if _model is None:
        print("🌐 Using Remote Hugging Face API (Saves RAM!)")
        _model = RemoteEmbedder()
    return _model