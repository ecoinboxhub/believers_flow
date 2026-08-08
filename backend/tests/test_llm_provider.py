import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


def _extract(data):
    from api.llm_provider import _extract_choice_content
    return _extract_choice_content(data)


def _valid(content):
    from api.llm_provider import _valid_content
    return _valid_content(content)


def test_extract_choice_content_returns_string():
    assert _extract({"choices": [{"message": {"content": "Hello there"}}]}) == "Hello there"


def test_extract_choice_content_handles_missing_or_null():
    assert _extract({"choices": [{"message": {"content": None}}]}) is None
    assert _extract({"choices": [{"message": {}}]}) is None
    assert _extract({"choices": []}) is None
    assert _extract({}) is None
    assert _extract(None) is None


def test_valid_content_rejects_blank():
    assert _valid("ok") is True
    assert _valid("  hello  ") is True
    assert _valid("") is False
    assert _valid("   ") is False
    assert _valid(None) is False
