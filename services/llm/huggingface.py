import os
import requests
from services.llm.base import LLMClient

class HuggingFaceClient(LLMClient):
    # Definimos los tipos explícitamente para que Pylance esté feliz
    api_url: str
    token: str

    def __init__(self):
        # 1. Obtenemos los valores
        api_url = os.getenv("HF_API_URL")
        token = os.getenv("HF_API_TOKEN")

        # 2. Validación de seguridad (esto elimina el warning)
        if api_url is None or token is None:
            raise RuntimeError(
                "Faltan variables de entorno: asegúrate de que HF_API_URL y HF_API_TOKEN estén en el .env"
            )

        # 3. Asignamos. Aquí Pylance ya sabe que NO son None
        self.api_url = api_url
        self.token = token
        self.model = "deepseek-ai/DeepSeek-V3" 

    def generate(self, prompt: str) -> str:
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system", 
                    "content": "Eres un asistente técnico experto. Responde brevemente usando el contexto."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            "max_tokens": 500,
            "temperature": 0.1
        }

        try:
            # Ahora self.api_url está garantizado como str, el error desaparece
            response = requests.post(
                url=self.api_url, 
                headers=headers,
                json=payload,
                timeout=30
            )
            
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

        except Exception as e:
            return f"Error en la llamada a la IA: {str(e)}"