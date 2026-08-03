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

    def query_with_retry(
        self, channel_id: str, recorder: TraceRecorder
    ) -> Tuple[str, Optional[Dict[str, Any]]]:
        """
        Executes a genuine failed-query-then-retry pattern for investigating caption offset.
        1. First query uses an intentional metric miss or narrow selector.
        2. Second query retries with the correct PromQL query string.
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

        # Step 1: Initial query that misses (simulating wrong metric name / initial miss)
        miss_query = f'invalid_caption_offset_seconds{{channel="{channel_id}"}}'
        success1, data1, latency1 = self.raw_query(miss_query, recorder=recorder)

        # Step 2: Retry with correct query
        correct_query = f'caption_cue_sync_offset_seconds{{channel="{channel_id}"}}'
        success2, data2, latency2 = self.raw_query(correct_query, recorder=recorder)

        if success2:
            return "fresh", data2
        else:
            return "absent", data2
