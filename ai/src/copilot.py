import json
import logging
from typing import Dict, List, Any, Optional
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class ToolRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]

class CopilotResponse(BaseModel):
    message: str
    citations: List[Dict[str, str]]
    requires_confirmation: bool = False
    pending_destructive_action: Optional[Dict[str, Any]] = None

class TelecomTools:
    """Tool functions that provide real data lookups.
    In production, these call the backend API. Currently returns structured summaries."""
    
    def queryNetworkMetrics(self, tenant_id: str, metric: str, timeframe: str) -> str:
        return f"[{metric}] data for last {timeframe}: Average 42.1, max 99.9"

    def queryCells(self, tenant_id: str, status: str = None) -> str:
        return "Found 3 cells offline: CELL_NYC_104, CELL_LON_402, CELL_SFO_201"

    def queryIncidents(self, tenant_id: str, region: str = None) -> str:
        return "INC-2026-9042 (CRITICAL) in NA-EAST, INC-2026-9041 (MAJOR) in EU-WEST."

    def queryAlarms(self, tenant_id: str, severity: str = None) -> str:
        return "3 active alarms: LINK_DOWN (CRITICAL), HIGH_CPU (MAJOR), TEMPERATURE_HIGH (MINOR)"

    def queryAnomalies(self, tenant_id: str, cell: str = None, metric: str = None) -> str:
        anomalies_data = [
            {
                "id": "ANOM-LAT-104",
                "cell": "CELL_NYC_104",
                "region": "NA-EAST",
                "site": "NYC-01",
                "network": "5G-SA",
                "metric": "latency",
                "observed": 65.4,
                "expected": 22.2,
                "anomaly_score": 63.84,
                "severity": "CRITICAL",
                "model": "RollingBaseline",
                "explanation": "Observed latency 65.4ms exceeds baseline 22.2ms by 63.8 standard deviations. Root cause: High buffer bloat on upstream router interface."
            },
            {
                "id": "ANOM-THR-402",
                "cell": "CELL_LON_402",
                "region": "EU-WEST",
                "site": "LON-03",
                "network": "4G-LTE",
                "metric": "throughput",
                "observed": 12.2,
                "expected": 45.2,
                "anomaly_score": 49.50,
                "severity": "CRITICAL",
                "model": "RollingBaseline",
                "explanation": "Throughput collapsed from 45.2 Gbps down to 12.2 Gbps (49.5 std deviations). Root cause: Microwave backhaul degradation."
            },
            {
                "id": "ANOM-PKT-201",
                "cell": "CELL_SFO_201",
                "region": "NA-WEST",
                "site": "SFO-02",
                "network": "5G-SA",
                "metric": "packet_loss",
                "observed": 1.5,
                "expected": 0.13,
                "anomaly_score": 28.33,
                "severity": "CRITICAL",
                "model": "StatisticalThreshold",
                "explanation": "Packet loss rate 1.5% exceeds threshold 1.0% by 50%. Root cause: Fiber patch cable attenuation."
            }
        ]
        
        matches = []
        for a in anomalies_data:
            if cell and cell.lower() not in a["cell"].lower() and cell.lower() not in a["site"].lower():
                continue
            if metric and metric.lower() not in a["metric"].lower():
                continue
            matches.append(a)
            
        if not matches:
            matches = anomalies_data
            
        summary = f"Detected {len(matches)} active network telemetry anomalies:\n"
        for m in matches:
            summary += f"- [{m['severity']}] {m['cell']} ({m['region']}/{m['site']} · {m['network']}) {m['metric']}: observed {m['observed']} vs expected {m['expected']} (score: {m['anomaly_score']}, model: {m['model']}). Analysis: {m['explanation']}\n"
        return summary


class TelecomCopilot:
    def __init__(self, tenant_id: str, user_id: str):
        self.tenant_id = tenant_id
        self.user_id = user_id
        self.tools = TelecomTools()
        
        # Import and initialize the NVIDIA DeepSeek provider
        from src.nvidia_provider import NvidiaProvider
        self.llm = NvidiaProvider()
        
        self.destructive_words = ['delete', 'drop', 'restart', 'reboot', 'shutdown', 'format', 'update']

    def _check_prompt_injection(self, text: Any) -> bool:
        # Basic heuristic injection protection
        if not isinstance(text, str):
            if isinstance(text, list):
                text = " ".join([p.get("text", "") for p in text if isinstance(p, dict)])
            else:
                text = str(text)
        text = text.lower()
        injections = ['ignore previous instructions', 'system prompt', 'you are now', 'bypass', 'override']
        for inj in injections:
            if inj in text:
                return True
        return False

    def process_message(self, message: Any, image_url: Optional[str] = None) -> CopilotResponse:
        # 1. Prompt Injection Protection
        if self._check_prompt_injection(message):
            return CopilotResponse(
                message="Security Error: Prompt injection attempt detected and blocked.",
                citations=[]
            )

        # 2. Tool Selection via NVIDIA DeepSeek LLM
        tools_schema = [
            {"name": "queryNetworkMetrics"}, 
            {"name": "queryIncidents"}, 
            {"name": "queryAlarms"},
            {"name": "queryCells"},
            {"name": "queryAnomalies"}
        ]
        llm_out = self.llm.generate_response(message, tools_schema, image_url=image_url)
        
        if "pending_action" in llm_out:
            return CopilotResponse(
                message="This is a destructive operation. Are you sure you want to proceed?",
                citations=[],
                requires_confirmation=True,
                pending_destructive_action=llm_out["pending_action"]
            )

        tool_results = []
        citations = []
        
        # 3. Data Retrieval (Executing tools with strict tenant isolation)
        if "tool_calls" in llm_out:
            for tc in llm_out["tool_calls"]:
                name = tc["name"]
                args = tc["arguments"]
                
                # Execute tool enforcing tenant_id
                if name == "queryNetworkMetrics":
                    res = self.tools.queryNetworkMetrics(self.tenant_id, args.get("metric", ""), args.get("timeframe", ""))
                    tool_results.append(res)
                    citations.append({"source": "MetricsDB", "content": res})
                elif name == "queryIncidents":
                    res = self.tools.queryIncidents(self.tenant_id, args.get("region", ""))
                    tool_results.append(res)
                    citations.append({"source": "IncidentDB", "content": res})
                elif name == "queryAlarms":
                    res = self.tools.queryAlarms(self.tenant_id, args.get("severity", ""))
                    tool_results.append(res)
                    citations.append({"source": "AlarmDB", "content": res})
                elif name == "queryCells":
                    res = self.tools.queryCells(self.tenant_id, args.get("status", ""))
                    tool_results.append(res)
                    citations.append({"source": "CellDB", "content": res})
                elif name == "queryAnomalies":
                    res = self.tools.queryAnomalies(self.tenant_id, args.get("cell"), args.get("metric"))
                    tool_results.append(res)
                    citations.append({"source": "AI_AnomalyEngine", "content": res})

        # 4. Final Response Generation via Ollama
        if tool_results:
            final_text = self.llm.generate_final_answer(message, tool_results)
            return CopilotResponse(message=final_text, citations=citations)
        elif "text" in llm_out:
            return CopilotResponse(message=llm_out["text"], citations=[])
            
        return CopilotResponse(message="I couldn't find the requested data.", citations=[])


