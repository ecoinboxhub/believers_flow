import os
import sys
import pytest
import asyncio
from httpx import AsyncClient, ASGITransport

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

os.environ.setdefault("DATABASE_URL", "postgres://test:test@localhost:5432/test_db")
os.environ.setdefault("JWT_SECRET_KEY", "pytest-secret-key-for-testing-only-32chars-min!")
os.environ.setdefault("PINECONE_API_KEY", "test-pinecone-key")
os.environ.setdefault("OPENAI_API_KEY", "test-openai-key")


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def anyio_backend():
    return "asyncio"
