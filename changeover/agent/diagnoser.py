"""
Diagnoser Module.
Gemini via ADK / google-genai SDK for investigating telemetry evidence and naming the failed layer.
"""
import os
import json
import logging
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class Diagnoser:
    """
    Gemini-powered telemetry diagnoser.
    Reads telemetry evidence and names the failed layer.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Could not initialize google.genai Client: {e}")

    def diagnose(
        self,
        channel_id: str,
        evidence_data: Dict[str, Any],
        caption_threshold: float = 0.75,
        liveness_threshold: float = 0.60,
    ) -> Dict[str, Any]:
        """
        Diagnoses telemetry evidence to isolate the failed layer.
        Discriminates between caption fault (caption_cue_sync_offset_seconds)
        and feed liveness fault (feed_liveness_seconds for sign_language stand-in).
        AD is never monitored, diagnosed, or ruled out.
        Returns dict: {failed_layer: str, rationale: str, confidence: float}
        """
        results = evidence_data.get("data", {}).get("result", [])
        caption_offset = 0.0
        liveness_gap = 0.0

        for r in results:
            metric_name = r.get("metric", {}).get("__name__")
            if metric_name == "caption_cue_sync_offset_seconds":
                try:
                    caption_offset = float(r.get("value", [0, 0])[1])
                except (ValueError, TypeError, IndexError):
                    pass
            elif metric_name == "feed_liveness_seconds":
                try:
                    liveness_gap = float(r.get("value", [0, 0])[1])
                except (ValueError, TypeError, IndexError):
                    pass

        # Formulate prompt for Gemini
        prompt = (
            f"You are Changeover Diagnoser, an AI broadcast accessibility agent.\n"
            f"Analyze telemetry evidence for channel '{channel_id}':\n"
            f"- Measured Caption Cue Sync Offset: {caption_offset:.3f}s (Threshold: {caption_threshold}s)\n"
            f"- Measured Feed Liveness Gap (Sign Language Stand-In): {liveness_gap:.3f}s (Threshold: {liveness_threshold}s)\n"
            f"(Note: Audio Description is not monitored in this build).\n"
            f"Identify which layer failed. Reply in strict JSON format:\n"
            f'{{"failed_layer": "captions" | "sign_language" | "none", "rationale": "...", "confidence": 1.0}}'
        )

        if self.client:
            try:
                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                text = response.text.strip()
                if "{" in text and "}" in text:
                    json_str = text[text.find("{"):text.rfind("}") + 1]
                    parsed = json.loads(json_str)
                    return parsed
            except Exception as e:
                logger.warning(f"Gemini API call failed, falling back to deterministic reasoning: {e}")

        # Deterministic evidence reasoning fallback
        if caption_offset > caption_threshold:
            return {
                "failed_layer": "captions",
                "rationale": f"Caption cue-sync offset ({caption_offset:.3f}s) exceeded ceiling ({caption_threshold:.2f}s).",
                "confidence": 1.0,
            }
        elif liveness_gap > liveness_threshold:
            return {
                "failed_layer": "sign_language",
                "rationale": f"Feed liveness gap on sign language stand-in feed ({liveness_gap:.3f}s) exceeded ceiling ({liveness_threshold:.2f}s).",
                "confidence": 1.0,
            }
        else:
            return {
                "failed_layer": "none",
                "rationale": f"All monitored layers nominal (Caption offset {caption_offset:.3f}s, Liveness gap {liveness_gap:.3f}s).",
                "confidence": 1.0,
            }
