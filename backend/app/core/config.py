import os
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "PharmaLens API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = Field(
        default="postgresql+psycopg2://postgres:postgres@localhost:5432/pharmalens",
        description="SQLAlchemy database connection URL"
    )
    
    # CORS
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    ADDITIONAL_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    
    # Storage
    UPLOAD_DIR: str = "./storage/uploads"
    MAX_UPLOAD_SIZE_MB: int = 10
    
    # Groq API (Planned for Phase 2 integration)
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    
    model_config = {
        "env_file": [
            os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
            os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"),
            ".env"
        ],
        "extra": "ignore"
    }

settings = Settings()

# Ensure local upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
