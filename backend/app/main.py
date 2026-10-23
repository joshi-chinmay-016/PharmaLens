from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import Base, engine
from app.api import health, investigations, sources

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PharmaLens API",
    description=(
        "AI-Powered Root Cause Analysis & CAPA for Pharmaceutical API Manufacturing.\n\n"
        "Tagline: See Beyond the Deviation. Investigate with intelligence. Act with evidence."
    ),
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
origins = [settings.FRONTEND_ORIGIN] + settings.ADDITIONAL_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log cleanly without exposing sensitive system traces to client
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred.",
            "error_type": exc.__class__.__name__,
        },
    )

# Register API Routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(investigations.router, prefix=settings.API_V1_STR)
app.include_router(sources.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "product": "PharmaLens",
        "description": "AI-Powered Root Cause Analysis & CAPA",
        "tagline": "See Beyond the Deviation.",
        "version": settings.VERSION,
        "docs": "/docs",
    }
