import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    ENVIRONMENT: str = Field(default="development")
    LOG_LEVEL: str = Field(default="INFO")
    
    # Server Ports
    API_PORT: int = Field(default=8000)
    API_HOST: str = Field(default="0.0.0.0")
    
    # Database
    MONGODB_URI: str = Field(default="mongodb+srv://ayushmang06_db_user:1234567890@polarbearvistaar.qmtf9h5.mongodb.net/?appName=polarbearVISTAAR")
    MONGODB_DB_NAME: str = Field(default="vistaar_production")
    
    # Redis / Asynchronous Queue
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    USE_IN_MEMORY_QUEUE: bool = Field(default=True)
    
    # Auth & Security
    JWT_SECRET: str = Field(default="vistaar_secure_production_secret_key_polar_science_2026_ncpor")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)
    
    # Super Admin Seed
    SUPER_ADMIN_EMAIL: str = Field(default="admin@vistaar.ncpor.res.in")
    SUPER_ADMIN_PASSWORD: str = Field(default="VistaarAdmin@2026!")
    
    # AI Provider Abstraction (Prompt 11)
    AI_PROVIDER: str = Field(default="gemini")
    AI_MODEL_NAME: str = Field(default="gemini-2.5-flash")
    AI_EMBEDDING_MODEL: str = Field(default="text-embedding-004")
    AI_TIMEOUT_SECONDS: float = Field(default=15.0)
    AI_MAX_RETRIES: int = Field(default=3)
    AI_RATE_LIMIT_RPM: int = Field(default=60)
    AI_LOG_SENSITIVE_PROMPTS: bool = Field(default=False)
    GEMINI_API_KEY: Optional[str] = Field(default=None)
    OPENAI_API_KEY: Optional[str] = Field(default=None)
    
    # Digital India Bhashini
    BHASHINI_USER_ID: Optional[str] = Field(default=None)
    BHASHINI_API_KEY: Optional[str] = Field(default=None)
    BHASHINI_PIPELINE_ID: Optional[str] = Field(default=None)
    
    # Storage & Cloudinary Media Pipeline
    STORAGE_PROVIDER: str = Field(default="local")
    STORAGE_LOCAL_PATH: str = Field(default="./data/storage")
    CLOUDINARY_CLOUD_NAME: Optional[str] = Field(default=None)
    CLOUDINARY_API_KEY: Optional[str] = Field(default=None)
    CLOUDINARY_API_SECRET: Optional[str] = Field(default=None)
    JWT_REFRESH_SECRET: str = Field(default="vistaar_secure_refresh_secret_key_polar_science_2026_ncpor")
    EMBEDDING_PROVIDER_KEY: Optional[str] = Field(default=None)
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
