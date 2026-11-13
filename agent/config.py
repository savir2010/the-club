"""Settings for the concierge agent. Secrets come from the environment, never from code."""
import json
import os
from pathlib import Path

from dotenv import load_dotenv

AGENT_DIR = Path(__file__).resolve().parent
APP_DIR = AGENT_DIR.parent
DATA_DIR = APP_DIR / "data"

# First file wins for each variable; real environment variables beat all of them.
for env_file in (AGENT_DIR / ".env", APP_DIR / ".env.local", APP_DIR / ".env", APP_DIR.parent / ".env"):
    if env_file.exists():
        load_dotenv(env_file, override=False)

API_KEY = os.getenv("ANTHROPIC_API_KEY") or os.getenv("ANTHROPIC_KEY")
MODEL = os.getenv("NORA_MODEL", "claude-sonnet-5-5")  # the model named in the demo brief
EFFORT = os.getenv("NORA_EFFORT", "medium")
MAX_STEPS = int(os.getenv("NORA_MAX_STEPS", "8"))
PORT = int(os.getenv("NORA_AGENT_PORT", "8100"))
# Nora's speaking voice (Microsoft neural voices via edge-tts; free, no key). en-IE-EmilyNeural is an Irish woman.
TTS_VOICE = os.getenv("NORA_VOICE", "en-IE-EmilyNeural")
TTS_RATE = os.getenv("NORA_VOICE_RATE", "+4%")


def load(name: str):
    return json.loads((DATA_DIR / name).read_text())
