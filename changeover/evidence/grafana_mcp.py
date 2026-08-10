"""
Grafana MCP Module.
Real MCP client connecting to Grafana Cloud Prometheus proxy with retry and blind state handling.
"""
import os
import time
import requests
import logging
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
        self, query_str: str, recorder: Optional[TraceRecorder] = None
    ) -> Tuple[bool, Any, float]:
        """
        Executes a Prometheus PromQL query via official Grafana Labs MCP server (mcp-grafana Go binary over stdio transport).
        Returns (success: bool, result_data: Any, latency_ms: float).
        """
        start_time = time.time()
        try:
            import asyncio
            import shutil
            from mcp import ClientSession, StdioServerParameters
            from mcp.client.stdio import stdio_client

            mcp_bin = (
                os.getenv("GRAFANA_MCP_BIN")
                or shutil.which("mcp-grafana")
                or ("/opt/homebrew/bin/mcp-grafana" if os.path.exists("/opt/homebrew/bin/mcp-grafana") else None)
                or ("/usr/local/bin/mcp-grafana" if os.path.exists("/usr/local/bin/mcp-grafana") else None)
            )

            if not mcp_bin or not os.path.exists(mcp_bin):
                raise RuntimeError(
                    "Grafana MCP server binary 'mcp-grafana' not found in PATH or GRAFANA_MCP_BIN. "
                    "Please install via 'brew install mcp-grafana' or set GRAFANA_MCP_BIN."
                )

            async def _run_mcp():
                server_params = StdioServerParameters(
                    command=mcp_bin,
                    args=["-disable-write"],
                    env=dict(os.environ),
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

            # Parse MCP content
            content_str = "".join([c.text for c in mcp_res.content if hasattr(c, "text")])
            if content_str and not mcp_res.isError:
                try:
                    parsed_data = json.loads(content_str)
                    # Support both raw result list and {"data": [...]} payload shapes
                    data_list = parsed_data.get("data", parsed_data) if isinstance(parsed_data, dict) else parsed_data
                    if recorder:
                        recorder.record_call(
                            tool="grafana_mcp.query_prometheus",
                            args={"expr": query_str, "transport": "mcp-stdio-official"},
                            result_or_miss=data_list,
                            latency_ms=latency_ms,
                        )
                    return True, {"data": {"result": data_list}}, latency_ms
                except Exception:
                    pass

        except Exception as e:
            logger.debug(f"Official MCP stdio invocation fallback to direct HTTP: {e}")

        # Fallback to direct HTTP query if stdio MCP is unavailable
        return self.raw_query(query_str, recorder=recorder)


    def query_with_retry(
        self, channel_id: str, recorder: TraceRecorder
    ) -> Tuple[str, Optional[Dict[str, Any]]]:
        """
        Executes Grafana Cloud MCP query directly to retrieve caption offset telemetry.
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

        # Execute PromQL telemetry query via official MCP tool
        correct_query = f'caption_cue_sync_offset_seconds{{channel="{channel_id}"}}'
        success, data, latency = self.query_mcp(correct_query, recorder=recorder)

        if success:
            return "fresh", data
        else:
            return "absent", data


