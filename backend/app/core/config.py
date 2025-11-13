from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: str

    DATABASE_URL: str

    openai_api_key: str

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()