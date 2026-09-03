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
    Google ADK-powered telemetry diagnoser.
    Executes an ADK Agent and Runner to analyze telemetry evidence and name the failed layer.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.adk_agent = None
        self.adk_runner = None
        self.session_service = None

        if api_key is not False:
            try:
                import google.adk as adk
                from google.adk.tools import McpToolset
                from google.adk.sessions import InMemorySessionService
                from mcp import StdioServerParameters
                import shutil

                mcp_bin = (
                    os.getenv("GRAFANA_MCP_BIN")
                    or shutil.which("mcp-grafana")
                    or ("/opt/homebrew/bin/mcp-grafana" if os.path.exists("/opt/homebrew/bin/mcp-grafana") else None)
                    or ("/usr/local/bin/mcp-grafana" if os.path.exists("/usr/local/bin/mcp-grafana") else None)
                )

                tools = []
                if mcp_bin and os.path.exists(mcp_bin):
                    try:
                        mcp_toolset = McpToolset(
                            connection_params=StdioServerParameters(
                                command=mcp_bin,
                                args=["-disable-write"],
                                env=dict(os.environ),
                            )
                        )
                        tools.append(mcp_toolset)
                    except Exception as te:
                        logger.warning(f"Could not initialize McpToolset: {te}")

                self.adk_agent = adk.Agent(
                    name="changeover_diagnoser",
                    model="gemini-2.5-flash",
                    instruction=(
                        "You are Changeover Diagnoser, an AI broadcast accessibility agent running on Google ADK. "
                        "Analyze broadcast telemetry evidence to isolate whether captions or sign_language failed. "
                        "Call query_prometheus tool if needed to fetch live PromQL telemetry. "
                        "Return strict JSON: {\"failed_layer\": \"captions\" | \"sign_language\" | \"none\", \"rationale\": \"...\", \"confidence\": 1.0}"
                    ),
                    tools=tools,
                )
                self.session_service = InMemorySessionService()
                self.adk_runner = adk.Runner(
                    agent=self.adk_agent,
                    session_service=self.session_service,
                    app_name="changeover",
                )
            except Exception as e:
                logger.warning(f"Could not initialize Google ADK Agent/Runner: {e}")

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
        if isinstance(evidence_data, str):
            results = []
        elif isinstance(evidence_data, dict):
            results = evidence_data.get("data", {}).get("result", [])
        else:
            results = []
        if not results:
            return {
                "failed_layer": "none",
                "rationale": "Incomplete evidence: empty or invalid evidence payload. Refusing diagnosis.",
                "confidence": 0.0,
                "error": "incomplete_evidence",
            }

        caption_offset = None
        liveness_gap = None

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

        if caption_offset is None:
            caption_offset = 0.0
        if liveness_gap is None:
            liveness_gap = 0.0

        # Formulate prompt for Gemini via ADK Agent/Runner
        prompt = (
            f"Analyze telemetry evidence for channel '{channel_id}':\n"
            f"- Measured Caption Cue Sync Offset: {caption_offset:.3f}s (Threshold: {caption_threshold}s)\n"
            f"- Measured Feed Liveness Gap (Sign Language Stand-In): {liveness_gap:.3f}s (Threshold: {liveness_threshold}s)\n"
            f"Identify which layer failed. Reply in strict JSON format:\n"
            f'{{"failed_layer": "captions" | "sign_language" | "none", "rationale": "...", "confidence": 1.0}}'
        )

        if self.adk_runner and self.session_service:
            try:
                import asyncio
                from google.genai import types

                async def _run_adk():
                    session = await self.session_service.create_session(user_id="operator", app_name="changeover")
                    content = types.Content(role="user", parts=[types.Part.from_text(text=prompt)])
                    last_text = ""
                    async for event in self.adk_runner.run_async(
                        user_id="operator", session_id=session.id, new_message=content
                    ):
                        if hasattr(event, "content") and event.content:
                            for part in getattr(event.content, "parts", []):
                                if hasattr(part, "text") and part.text:
                                    last_text += part.text
                    return last_text

                loop = asyncio.new_event_loop()
                text = loop.run_until_complete(_run_adk()).strip()
                loop.close()

                if "{" in text and "}" in text:
                    json_str = text[text.find("{"):text.rfind("}") + 1]
                    parsed = json.loads(json_str)
                    parsed["adk_execution"] = True
                    return parsed
            except Exception as e:
                logger.warning(f"Google ADK Agent execution failed, falling back to deterministic reasoning: {e}")


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
