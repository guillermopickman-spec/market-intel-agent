from gpt4all import GPT4All
from services.llm.base import LLMClient

class LocalGPT4AllClient(LLMClient):
    def __init__(self):
        self.model = GPT4All(
            model_name="Phi-3-mini-4k-instruct.Q4_0.gguf",
            #model_path=r"C:/Users/Guill/.gpt4all/models",
            allow_download=False
        )

    def generate(self, prompt: str) -> str:
        return self.model.generate(prompt, max_tokens=256, temp=0.7)
