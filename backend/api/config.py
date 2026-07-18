import os
import sys
import logging

logger = logging.getLogger("beliversflow.config")


class ConfigError(Exception):
    pass


REQUIRED_VARS = {
    "DATABASE_URL": {
        "description": "PostgreSQL connection string",
        "example": "postgres://user:pass@host:5432/dbname?sslmode=require",
    },
    "JWT_SECRET_KEY": {
        "description": "Secret key for JWT token signing (min 32 chars)",
        "example": "python -c \"import secrets; print(secrets.token_urlsafe(64))\"",
        "min_length": 32,
    },
}

OPTIONAL_VARS = {
    "GROQ_API_KEY": {"description": "GROQ API key for LLM"},
    "OPENAI_API_KEY": {"description": "OpenAI API key for embeddings"},
    "OPENROUTER_API_KEY": {"description": "OpenRouter API key for LLM"},
    "GOOGLE_CLIENT_ID": {"description": "Google OAuth client ID"},
    "GOOGLE_CLIENT_SECRET": {"description": "Google OAuth client secret"},
    "PINECONE_API_KEY": {"description": "Pinecone API key for RAG"},
    "PINECONE_INDEX": {"default": "believersflow", "description": "Pinecone index name"},
    "PINECONE_HOST": {"description": "Pinecone host URL"},
    "ALLOWED_ORIGINS": {"description": "Comma-separated CORS origins"},
    "RATE_LIMIT_PER_MINUTE": {"default": "60", "description": "Rate limit RPM"},
    "SMTP_HOST": {"description": "SMTP server host for email delivery"},
    "SMTP_PORT": {"default": "587", "description": "SMTP server port"},
    "SMTP_USER": {"description": "SMTP username"},
    "SMTP_PASSWORD": {"description": "SMTP password"},
    "SMTP_FROM": {"default": "noreply@believersflow.app", "description": "Sender email address"},
    "FRONTEND_URL": {"default": "https://christian-task-manager.vercel.app", "description": "Frontend URL for email links"},
    "APP_ENV": {"default": "development", "description": "Application environment (development/production)"},
    "LOG_FORMAT": {"default": "text", "description": "Log format (text/json)"},
    "LOG_LEVEL": {"default": "INFO", "description": "Logging level (DEBUG/INFO/WARNING/ERROR)"},
    "REDIS_URL": {"description": "Redis URL for distributed rate limiting (e.g., redis://localhost:6379)"},
}


def validate_config() -> dict:
    errors = []
    warnings = []
    config = {}

    for var_name, var_info in REQUIRED_VARS.items():
        value = os.environ.get(var_name, "").strip()
        if not value:
            errors.append(
                f"  MISSING: {var_name} — {var_info['description']}\n"
                f"           Generate with: {var_info['example']}"
            )
            continue
        min_len = var_info.get("min_length", 0)
        if min_len and len(value) < min_len:
            errors.append(
                f"  TOO SHORT: {var_name} — must be at least {min_len} chars (got {len(value)})"
            )
            continue
        config[var_name] = value

    for var_name, var_info in OPTIONAL_VARS.items():
        value = os.environ.get(var_name, "").strip()
        if value:
            config[var_name] = value
        elif "default" in var_info:
            config[var_name] = var_info["default"]
        else:
            warnings.append(f"  OPTIONAL: {var_name} — {var_info.get('description', '')}")

    if errors:
        logger.error("=" * 60)
        logger.error("STARTUP FAILED — Missing or invalid environment variables")
        logger.error("=" * 60)
        for err in errors:
            logger.error(err)
        logger.error("=" * 60)
        logger.error("Copy backend/.env.example to backend/.env and fill in values")
        logger.error("=" * 60)
        sys.exit(1)

    if warnings:
        logger.warning("Optional environment variables not set:")
        for w in warnings:
            logger.warning(w)

    has_llm = any(config.get(k) for k in ["GROQ_API_KEY", "OPENAI_API_KEY", "OPENROUTER_API_KEY"])
    if not has_llm:
        warnings.append("  No LLM API keys configured — AI features will be disabled")

    has_rag = bool(config.get("PINECONE_API_KEY"))
    if not has_rag:
        warnings.append("  PINECONE_API_KEY not set — RAG features will be disabled")

    config["HAS_LLM"] = has_llm
    config["HAS_RAG"] = has_rag

    return config


_config = None


def get_config() -> dict:
    global _config
    if _config is None:
        _config = validate_config()
    return _config
