from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5-coder:7b"
    MAX_TOKENS: int = 4096
    TEMPERATURE: float = 0.2
    REQUEST_TIMEOUT_SECONDS: float = 60.0
    MAX_CONVERSATION_MESSAGES: int = 20

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
