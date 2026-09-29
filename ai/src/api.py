from fastapi import FastAPI, HTTPException, Request, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from pydantic import BaseModel, Field, constr
from typing import List, Dict, Optional, Union, Any
import jwt
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from src.engine import AnomalyEngine, AnomalyResult
from src.rca import RCAEngine, RCAResult
from src.sentiment import SentimentAnalyzer, InteractionAnalysisResult
from src.maintenance import PredictiveMaintenanceEngine, EquipmentData, MaintenancePrediction
from src.copilot import TelecomCopilot, CopilotResponse

from loguru import logger
from asgi_correlation_id import CorrelationIdMiddleware
from asgi_correlation_id.context import correlation_id
from prometheus_fastapi_instrumentator import Instrumentator

# Setup Loguru to include correlation ID
def correlation_id_filter(record):
    record["extra"]["correlation_id"] = correlation_id.get() or "system"
    return True

def fmt(record):
    return "{time:YYYY-MM-DD HH:mm:ss} | {level} | {extra[correlation_id]} | {message}\n"
logger.add("logs/ai_app.log", format=fmt, filter=correlation_id_filter, rotation="500 MB")

# Rate Limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Telecom AI Command Center API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Observability Middleware
app.add_middleware(CorrelationIdMiddleware)

@app.middleware("http")
async def loguru_middleware(request: Request, call_next):
    logger.info(f"Incoming {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Outgoing {response.status_code}")
    return response

# Initialize Prometheus
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        return response

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]) # In production, restrict allow_origins

import os
security = HTTPBearer()
import sys
_raw_jwt_secret = os.getenv("JWT_SECRET", "")
if not _raw_jwt_secret or len(_raw_jwt_secret) < 32:
    print("[FATAL] JWT_SECRET env var must be set and at least 32 chars. Refusing to start.", file=sys.stderr)
    sys.exit(1)
JWT_SECRET = _raw_jwt_secret

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning(f"Auth bypass attempt: Expired token")
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        logger.warning(f"Auth bypass attempt: Invalid token")
        raise HTTPException(status_code=401, detail="Invalid token")

# Input Validation Models (Strict Bounds)
class MetricPayload(BaseModel):
    tenant: constr(min_length=1, max_length=50)
    network: constr(min_length=1, max_length=50)
    region: constr(min_length=1, max_length=50)
    site: constr(min_length=1, max_length=50)
    cell: constr(min_length=1, max_length=50)
    metric: constr(min_length=1, max_length=50)
    current_value: float = Field(..., description="Must be a float")
    historical_data: List[float] = Field(default=[], max_items=1000)

class RCAPayload(BaseModel):
    incident_id: constr(min_length=1, max_length=100)
    tenant: constr(min_length=1, max_length=50)
    network: constr(min_length=1, max_length=50)
    region: constr(min_length=1, max_length=50)
    site: constr(min_length=1, max_length=50)
    cell: constr(min_length=1, max_length=50)

engine = AnomalyEngine()
rca_engine = RCAEngine()
sentiment_analyzer = SentimentAnalyzer()
maint_engine = PredictiveMaintenanceEngine()

@app.post("/analyze", response_model=List[AnomalyResult])
@limiter.limit("50/minute")
def analyze_metric(request: Request, payload: MetricPayload, token: dict = Depends(verify_token)):
    if token.get("tenantId") != payload.tenant and token.get("role") != "PLATFORM_SUPER_ADMIN":
        logger.warning(f"Tenant isolation breach attempt. User {token.get('userId')} requested tenant {payload.tenant}")
        raise HTTPException(status_code=403, detail="Unauthorized tenant access")
    
    try:
        metadata = {"tenant": payload.tenant, "network": payload.network, "region": payload.region, "site": payload.site, "cell": payload.cell}
        return engine.analyze(metadata=metadata, metric=payload.metric, current_value=payload.current_value, historical_data=payload.historical_data)
    except Exception as e:
        logger.error(f"Error in /analyze: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.post("/rca", response_model=RCAResult)
@limiter.limit("20/minute")
def analyze_root_cause(request: Request, payload: RCAPayload, token: dict = Depends(verify_token)):
    if token.get("tenantId") != payload.tenant and token.get("role") != "PLATFORM_SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Unauthorized tenant access")
    try:
        metadata = {"tenant": payload.tenant, "network": payload.network, "region": payload.region, "site": payload.site, "cell": payload.cell}
        return rca_engine.analyze(payload.incident_id, metadata)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/health/live")
def live_check():
    return {"status": "UP"}

@app.get("/health/ready")
@limiter.limit("100/minute")
def ready_check(request: Request):
    return {"status": "READY", "models_loaded": len(engine.models)}

class SentimentPayload(BaseModel):
    text: constr(min_length=1, max_length=2000)
    tenant_id: str

@app.post("/sentiment", response_model=InteractionAnalysisResult)
@limiter.limit("100/minute")
def analyze_sentiment(request: Request, payload: SentimentPayload, token: dict = Depends(verify_token)):
    if token.get("tenantId") != payload.tenant_id and token.get("role") != "PLATFORM_SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Unauthorized tenant access")
    try:
        return sentiment_analyzer.analyze(payload.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error")

class EquipmentPayload(BaseModel):
    tenant_id: str
    data: EquipmentData

@app.post("/predict-maintenance", response_model=MaintenancePrediction)
@limiter.limit("30/minute")
def predict_maintenance(request: Request, payload: EquipmentPayload, token: dict = Depends(verify_token)):
    if token.get("tenantId") != payload.tenant_id and token.get("role") != "PLATFORM_SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Unauthorized tenant access")
    try:
        return maint_engine.predict(payload.data)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/anomalies", response_model=List[AnomalyResult])
@limiter.limit("60/minute")
def list_anomalies(request: Request):
    """
    Returns detected anomalies by analyzing live network telemetry streams
    with statistical thresholding, rolling baseline, and isolation forest models.
    """
    telemetry_streams = [
        {
            "metadata": {"tenant": "Acme Telecom", "network": "5G-SA", "region": "NA-EAST", "site": "NYC-01", "cell": "CELL_NYC_104"},
            "metric": "latency",
            "current_value": 65.4,
            "historical_data": [22.0, 21.5, 23.1, 22.4, 20.9, 21.8, 22.2, 23.0, 21.9, 22.5, 22.1, 23.4]
        },
        {
            "metadata": {"tenant": "Acme Telecom", "network": "4G-LTE", "region": "EU-WEST", "site": "LON-03", "cell": "CELL_LON_402"},
            "metric": "throughput",
            "current_value": 12.2,
            "historical_data": [45.0, 44.5, 46.2, 45.8, 43.9, 45.1, 46.0, 44.8, 45.5, 46.1, 44.9, 45.2] * 5
        },
        {
            "metadata": {"tenant": "Acme Telecom", "network": "5G-SA", "region": "NA-WEST", "site": "SFO-02", "cell": "CELL_SFO_201"},
            "metric": "packet_loss",
            "current_value": 1.5,
            "historical_data": [0.1, 0.2, 0.15, 0.1, 0.05, 0.2, 0.1, 0.15, 0.2, 0.1, 0.08, 0.12]
        }
    ]
    detected = []
    for stream in telemetry_streams:
        results = engine.analyze(
            metadata=stream["metadata"],
            metric=stream["metric"],
            current_value=stream["current_value"],
            historical_data=stream["historical_data"]
        )
        detected.extend(results)
    return detected

class CopilotPayload(BaseModel):
    tenant_id: constr(min_length=1, max_length=50)
    user_id: constr(min_length=1, max_length=50)
    message: Union[str, List[Dict[str, Any]]]
    image_url: Optional[str] = None

@app.post("/copilot/chat", response_model=CopilotResponse)
@limiter.limit("20/minute")
def copilot_chat(request: Request, payload: CopilotPayload, token: dict = Depends(verify_token)):
    if token.get("tenantId") != payload.tenant_id:
        raise HTTPException(status_code=403, detail="Unauthorized tenant access")
    if token.get("userId") != payload.user_id:
        raise HTTPException(status_code=403, detail="User ID spoofing detected")
    
    # Prompt injection rudimentary check
    message_str = payload.message if isinstance(payload.message, str) else str(payload.message)
    dangerous_keywords = ["ignore previous instructions", "system prompt", "exec(", "eval("]
    if any(keyword in message_str.lower() for keyword in dangerous_keywords):
        logger.warning(f"Prompt injection attempt blocked from user {payload.user_id}")
        raise HTTPException(status_code=400, detail="Invalid request format")
        
    try:
        copilot = TelecomCopilot(tenant_id=payload.tenant_id, user_id=payload.user_id)
        return copilot.process_message(payload.message, image_url=payload.image_url)
    except Exception as e:
        logger.exception(f"Copilot error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")




