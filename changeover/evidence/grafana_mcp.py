"""
Grafana MCP Module.
Real MCP client connecting to Grafana Cloud Prometheus proxy with retry and blind state handling.
"""
import os
import time
import json
import requests
import logging
import shutil
from typing import Dict, Any, Tuple, Optional
from dotenv import load_dotenv
from changeover.trace.recorder import TraceRecorder

load_dotenv()

logger = logging.getLogger(__name__)


class GrafanaMCPClient:
    """
    Real MCP client for Grafana Cloud Prometheus query API.
    """

    def __init__(
        self,
        grafana_url: Optional[str] = None,
        token: Optional[str] = None,
        datasource_uid: str = "grafanacloud-prom",
    ):
        self.grafana_url = (grafana_url or os.getenv("GRAFANA_URL", "")).rstrip("/")
        self.token = token or os.getenv("GRAFANA_SERVICE_ACCOUNT_TOKEN", "")
        self.datasource_uid = datasource_uid
        self.query_endpoint = (
            f"{self.grafana_url}/api/datasources/proxy/uid/{self.datasource_uid}/api/v1/query"
        )

    def is_available(self) -> bool:
        """
        Checks if the Grafana endpoint and token are present and reachable.
        """
        if not self.grafana_url or not self.token:
            return False
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            res = requests.get(f"{self.grafana_url}/api/datasources", headers=headers, timeout=3.0)
            return res.status_code == 200
        except Exception as e:
            logger.warning(f"Grafana endpoint availability check failed: {e}")
            return False

    def raw_query(
        self, query_str: str, recorder: Optional[TraceRecorder] = None
    ) -> Tuple[bool, Any, float]:
        """
        Executes a Prometheus PromQL query against Grafana Cloud proxy.
        Returns (success: bool, result_data: Any, latency_ms: float).
        """
        if not self.grafana_url or not self.token:
            if recorder:
                recorder.record_call(
                    tool="grafana_mcp.query",
                    args={"query": query_str},
                    result_or_miss="BLIND: missing credentials",
                    latency_ms=0.0,
                )
            return False, "BLIND: missing credentials", 0.0

        headers = {"Authorization": f"Bearer {self.token}"}
        start_time = time.time()
        try:
            res = requests.get(
                self.query_endpoint,
                headers=headers,
                params={"query": query_str},
                timeout=5.0,
            )
            latency_ms = (time.time() - start_time) * 1000.0

            if res.status_code == 200:
                json_data = res.json()
                data_result = json_data.get("data", {}).get("result", [])
                success = len(data_result) > 0
                result_str = data_result if success else "MISS: empty result"

                if recorder:
                    recorder.record_call(
                        tool="grafana_mcp.query",
                        args={"query": query_str},
                        result_or_miss=result_str,
                        latency_ms=latency_ms,
                    )
                return success, json_data, latency_ms
            else:
                err_msg = f"HTTP {res.status_code}: {res.text}"
                if recorder:
                    recorder.record_call(
                        tool="grafana_mcp.query",
                        args={"query": query_str},
                        result_or_miss=f"MISS: {err_msg}",
                        latency_ms=latency_ms,
                    )
                return False, err_msg, latency_ms

        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000.0
            err_msg = f"BLIND: network error {e}"
            if recorder:
                recorder.record_call(
                    tool="grafana_mcp.query",
                    args={"query": query_str},
                    result_or_miss=err_msg,
                    latency_ms=latency_ms,
                )
            return False, err_msg, latency_ms

    def query_mcp(
        self,
        query_str: str,
        recorder: Optional[TraceRecorder] = None,
        allow_http_fallback: bool = False,
    ) -> Tuple[bool, Any, float]:
        """
        Executes a Prometheus PromQL query via official Grafana Labs MCP server (mcp-grafana Go binary over stdio transport).
        Returns (success: bool, result_data: Any, latency_ms: float).
        If allow_http_fallback is False, strictly fails when MCP stdio execution fails (no silent HTTP fallback).
        """
        start_time = time.time()
        mcp_bin = (
            os.getenv("GRAFANA_MCP_BIN")
            or shutil.which("mcp-grafana")
            or ("/opt/homebrew/bin/mcp-grafana" if os.path.exists("/opt/homebrew/bin/mcp-grafana") else None)
            or ("/usr/local/bin/mcp-grafana" if os.path.exists("/usr/local/bin/mcp-grafana") else None)
        )

        if not mcp_bin or not os.path.exists(mcp_bin):
            err_msg = (
                "Grafana MCP server binary 'mcp-grafana' not found in PATH or GRAFANA_MCP_BIN. "
                "Refusing query on qualified MCP path."
            )
            logger.warning(err_msg)
            if recorder:
                recorder.record_call(
                    tool="grafana_mcp.query_prometheus",
                    args={"expr": query_str, "transport": "mcp-stdio-official"},
                    result_or_miss=f"BLIND: {err_msg}",
                    latency_ms=0.0,
                )
            if allow_http_fallback:
                return self.raw_query(query_str, recorder=recorder)
            return False, f"BLIND: {err_msg}", 0.0

        try:
            import asyncio
            from mcp import ClientSession, StdioServerParameters
            from mcp.client.stdio import stdio_client

            async def _run_mcp():
                env = dict(os.environ)
                if self.token:
                    env["GRAFANA_SERVICE_ACCOUNT_TOKEN"] = self.token
                    env["GRAFANA_API_KEY"] = self.token
                if self.grafana_url:
                    env["GRAFANA_URL"] = self.grafana_url

                server_params = StdioServerParameters(
                    command=mcp_bin,
                    args=["-disable-write"],
                    env=env,
                )
                arguments = {
                    "datasourceUid": self.datasource_uid,
                    "expr": query_str,
                    "queryType": "instant",
                    "startTime": "now-1m",
                    "endTime": "now",
                }

                async with stdio_client(server_params) as (read, write):
                    async with ClientSession(read, write) as session:
                        await session.initialize()
                        res = await session.call_tool("query_prometheus", arguments=arguments)
                        return res

            loop = asyncio.new_event_loop()
            mcp_res = loop.run_until_complete(_run_mcp())
            loop.close()

            latency_ms = (time.time() - start_time) * 1000.0

            content_str = "".join([c.text for c in mcp_res.content if hasattr(c, "text")])
            if content_str and not mcp_res.isError:
                try:
                    parsed_data = json.loads(content_str)
                    data_list = parsed_data.get("data", parsed_data) if isinstance(parsed_data, dict) else parsed_data
                    if recorder:
                        recorder.record_call(
                            tool="grafana_mcp.query",
                            args={"query": query_str, "expr": query_str, "transport": "mcp-stdio-official"},
                            result_or_miss=data_list,
                            latency_ms=latency_ms,
                        )
                    return True, {"data": {"result": data_list}}, latency_ms
                except Exception as pe:
                    print(f"JSON parsing error from mcp-grafana: {pe}")
            else:
                logger.warning(f"mcp_res isError={getattr(mcp_res, 'isError', None)}, content_str='{content_str}'")

        except Exception as e:
            import traceback
            logger.warning(f"Official MCP stdio invocation failed: {e}")
            traceback.print_exc()
            if recorder:
                recorder.record_call(
                    tool="grafana_mcp.query_prometheus",
                    args={"expr": query_str, "transport": "mcp-stdio-official"},
                    result_or_miss=f"BLIND: MCP execution failed ({e})",
                    latency_ms=(time.time() - start_time) * 1000.0,
                )

        if allow_http_fallback:
            return self.raw_query(query_str, recorder=recorder)

        return False, "BLIND: MCP execution failed", (time.time() - start_time) * 1000.0

    def query_with_retry(
        self, channel_id: str, recorder: TraceRecorder, allow_http_fallback: bool = False
    ) -> Tuple[str, Optional[Dict[str, Any]]]:
        """
        Executes Grafana Cloud MCP query directly to retrieve BOTH caption offset and feed liveness telemetry.
        Returns (status: 'fresh' | 'absent' | 'blind', metric_data: Optional[Dict]).
        """
        if not self.is_available():
            logger.warning("Grafana MCP endpoint is BLIND / unreachable.")
            recorder.record_call(
                tool="grafana_mcp.investigate",
                args={"channel": channel_id},
                result_or_miss="BLIND: endpoint unreachable",
                latency_ms=0.0,
            )
            return "blind", None

        # Execute dual PromQL query for both required signals
        dual_query = f'caption_cue_sync_offset_seconds{{channel="{channel_id}"}} or feed_liveness_seconds{{channel="{channel_id}"}}'
        success, data, latency = self.query_mcp(dual_query, recorder=recorder, allow_http_fallback=allow_http_fallback)

        if success:
            return "fresh", data
        else:
            return "absent", data

    def create_annotation_mcp(
        self,
        run_id: str,
        channel_id: str,
        annotation_payload: Dict[str, Any],
        text_summary: str,
        tags: Optional[list] = None,
    ) -> Tuple[bool, Any]:
        """
        Creates a post-authorization Grafana annotation via official mcp-grafana write tool.
        Enforces idempotency by run_id tag.
        """
        mcp_bin = (
            os.getenv("GRAFANA_MCP_BIN")
            or shutil.which("mcp-grafana")
            or ("/opt/homebrew/bin/mcp-grafana" if os.path.exists("/opt/homebrew/bin/mcp-grafana") else None)
            or ("/usr/local/bin/mcp-grafana" if os.path.exists("/usr/local/bin/mcp-grafana") else None)
        )

        if not mcp_bin or not os.path.exists(mcp_bin):
            return False, "mcp-grafana binary not found"

        # Check idempotency first: look for existing annotation with run_id tag
        run_tag = f"run_id:{run_id}"
        existing_success, existing_data = self.get_annotation_mcp(run_id=run_id)
        if existing_success and existing_data:
            logger.info(f"Annotation for run_id '{run_id}' already exists. Idempotent skip.")
            return True, {"idempotent_skip": True, "existing_annotation": existing_data}

        annotation_tags = ["changeover", "smoke_test", f"channel:{channel_id}", run_tag]
        if tags:
            annotation_tags.extend(tags)

        try:
            import asyncio
            from mcp import ClientSession, StdioServerParameters
            from mcp.client.stdio import stdio_client

            async def _create_annotation():
                env = dict(os.environ)
                if self.token:
                    env["GRAFANA_SERVICE_ACCOUNT_TOKEN"] = self.token
                    env["GRAFANA_API_KEY"] = self.token
                if self.grafana_url:
                    env["GRAFANA_URL"] = self.grafana_url

                # Write-enabled MCP server call (no -disable-write)
                server_params = StdioServerParameters(
                    command=mcp_bin,
                    args=[],
                    env=env,
                )
                arguments = {
                    "text": f"Changeover Operational Decision [Run: {run_id}] - {text_summary}",
                    "tags": annotation_tags,
                    "time": int(time.time() * 1000),
                    "data": annotation_payload,
                }
                async with stdio_client(server_params) as (read, write):
                    async with ClientSession(read, write) as session:
                        await session.initialize()
                        res = await session.call_tool("create_annotation", arguments=arguments)
                        return res

            loop = asyncio.new_event_loop()
            mcp_res = loop.run_until_complete(_create_annotation())
            loop.close()

            content_str = "".join([c.text for c in mcp_res.content if hasattr(c, "text")])
            if content_str and not mcp_res.isError:
                parsed = json.loads(content_str)
                return True, parsed
            else:
                return False, content_str or "Error creating annotation"

        except Exception as e:
            logger.error(f"Failed to create annotation via mcp-grafana: {e}")
            return False, str(e)

    def get_annotation_mcp(self, run_id: str) -> Tuple[bool, Any]:
        """
        Retrieves a stored Grafana annotation by run_id tag via mcp-grafana tool.
        """
        mcp_bin = (
            os.getenv("GRAFANA_MCP_BIN")
            or shutil.which("mcp-grafana")
            or ("/opt/homebrew/bin/mcp-grafana" if os.path.exists("/opt/homebrew/bin/mcp-grafana") else None)
            or ("/usr/local/bin/mcp-grafana" if os.path.exists("/usr/local/bin/mcp-grafana") else None)
        )

        if not mcp_bin or not os.path.exists(mcp_bin):
            return False, "mcp-grafana binary not found"

        run_tag = f"run_id:{run_id}"

        try:
            import asyncio
            from mcp import ClientSession, StdioServerParameters
            from mcp.client.stdio import stdio_client

            async def _get_annotation():
                env = dict(os.environ)
                if self.token:
                    env["GRAFANA_SERVICE_ACCOUNT_TOKEN"] = self.token
                    env["GRAFANA_API_KEY"] = self.token
                if self.grafana_url:
                    env["GRAFANA_URL"] = self.grafana_url

                server_params = StdioServerParameters(
                    command=mcp_bin,
                    args=["-disable-write"],
                    env=env,
                )
                arguments = {
                    "tags": [run_tag],
                    "limit": 10,
                }
                async with stdio_client(server_params) as (read, write):
                    async with ClientSession(read, write) as session:
                        await session.initialize()
                        res = await session.call_tool("get_annotations", arguments=arguments)
                        return res

            loop = asyncio.new_event_loop()
            mcp_res = loop.run_until_complete(_get_annotation())
            loop.close()

            content_str = "".join([c.text for c in mcp_res.content if hasattr(c, "text")])
            if content_str and not mcp_res.isError:
                parsed = json.loads(content_str)
                # Parse list or dict response
                matches = []
                if isinstance(parsed, list):
                    matches = parsed
                elif isinstance(parsed, dict):
                    matches = parsed.get("annotations") or parsed.get("Payload") or []

                if len(matches) > 0:
                    return True, matches
                else:
                    return False, None
            return False, content_str

        except Exception as e:
            logger.error(f"Failed to retrieve annotation via mcp-grafana: {e}")
            return False, str(e)



