import base64
import logging
from deepgram import DeepgramClient, PrerecordedOptions

from app.config import settings

logger = logging.getLogger(__name__)


class STTService:
    """Speech-to-Text service using Deepgram API."""

    def __init__(self):
        self._client = None

    @property
    def client(self):
        if self._client is None and settings.deepgram_api_key and settings.deepgram_api_key != "your-deepgram-api-key":
            self._client = DeepgramClient(settings.deepgram_api_key)
        return self._client

    async def transcribe_audio(self, audio_base64: str) -> dict:
        """Transcribe base64-encoded audio and return transcript with word confidences."""
        if not self.client:
            logger.warning("Deepgram not configured — returning mock transcript")
            return {
                "transcript": "This is a mock transcript because Deepgram is not configured.",
                "confidence": 0.95,
                "words": [
                    {"word": "this", "confidence": 0.99, "start": 0.0, "end": 0.2},
                    {"word": "is", "confidence": 0.98, "start": 0.2, "end": 0.3},
                    {"word": "a", "confidence": 0.97, "start": 0.3, "end": 0.4},
                    {"word": "mock", "confidence": 0.96, "start": 0.4, "end": 0.6},
                    {"word": "transcript", "confidence": 0.95, "start": 0.6, "end": 1.0},
                ],
            }

        try:
            audio_bytes = base64.b64decode(audio_base64)

            options = PrerecordedOptions(
                model="nova-3",
                language="en",
                smart_format=True,
                punctuate=True,
                diarize=False,
                utterances=True,
            )

            source = {"buffer": audio_bytes, "mimetype": "audio/webm"}
            response = await self.client.listen.asyncrest.v("1").transcribe_file(source, options)

            result = response.to_dict()
            channel = result.get("results", {}).get("channels", [{}])[0]
            alternative = channel.get("alternatives", [{}])[0]

            transcript = alternative.get("transcript", "")
            confidence = alternative.get("confidence", 0.0)
            words = [
                {
                    "word": w.get("word", ""),
                    "confidence": w.get("confidence", 0.0),
                    "start": w.get("start", 0.0),
                    "end": w.get("end", 0.0),
                }
                for w in alternative.get("words", [])
            ]

            return {
                "transcript": transcript,
                "confidence": confidence,
                "words": words,
            }

        except Exception as e:
            logger.error(f"STT transcription failed: {e}")
            raise RuntimeError(f"Speech-to-text failed: {e}")

    async def transcribe_text_fallback(self, text: str) -> dict:
        """Fallback for text input (when mic is not available)."""
        words = text.split()
        return {
            "transcript": text,
            "confidence": 1.0,
            "words": [
                {"word": w, "confidence": 1.0, "start": i * 0.3, "end": (i + 1) * 0.3}
                for i, w in enumerate(words)
            ],
        }


stt_service = STTService()
