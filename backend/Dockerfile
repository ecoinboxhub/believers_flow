# =============================================================
# BelieversFlow backend Dockerfile
# Scoped for best-practice secret handling:
#   - .dockerignore excludes .env, keys, tests, build artifacts
#   - Runs as a non-root user (least privilege, OWASP ASVS V2)
#   - .env is never copied into the image
# =============================================================
FROM python:3.12-slim AS runtime

# Non-root user (also ensures the app never runs as root)
ENV APP_USER=appuser
ENV APP_UID=10001
ENV APP_GID=10001

WORKDIR /app

# Install OS build deps (gcc/libpq) in a way that avoids root ownership
# of build artifacts in the final stage.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy ONLY application code (secrets are excluded via .dockerignore and
# must be supplied through platform env vars at runtime; never baked in).
COPY . .

# Create a non-root user and grant ownership of the app directory so the
# process can write caches/temp files without root privileges (OWASP ASVS v2).
RUN groupadd --gid $APP_GID ${APP_USER} \
    && useradd --create-home --uid $APP_UID --gid $APP_GID --shell /bin/bash ${APP_USER} \
    && chown -R ${APP_USER}:${APP_GID} /app \
    && chmod +x /app/entrypoint.sh

# Drop privileges: run everything as the unprivileged user from here on.
USER ${APP_USER}

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import httpx; r = httpx.get('http://localhost:8000/api/health'); r.raise_for_status()"

CMD ["./entrypoint.sh"]