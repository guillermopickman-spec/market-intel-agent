from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: Optional[str] = None
    HF_API_TOKEN: Optional[str] = None
    HF_API_URL: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore" # Evita errores si hay más variables en el .env
    )

settings = Settings()