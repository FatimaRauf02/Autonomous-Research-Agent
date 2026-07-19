from celery import Celery
from core.config import settings


def make_redis_url(url: str) -> str:
    """Add ssl_cert_reqs=CERT_NONE to rediss:// URLs if not already present."""
    if url and url.startswith("rediss://") and "ssl_cert_reqs" not in url:
        sep = "&" if "?" in url else "?"
        return f"{url}{sep}ssl_cert_reqs=CERT_NONE"
    return url


broker = make_redis_url(settings.CELERY_BROKER_URL)
backend = make_redis_url(settings.CELERY_RESULT_BACKEND)

celery_app = Celery(
    "research_agent",
    broker=broker,
    backend=backend,
    include=["scheduler.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    broker_use_ssl={"ssl_cert_reqs": "CERT_NONE"} if broker.startswith("rediss://") else None,
    redis_backend_use_ssl={"ssl_cert_reqs": "CERT_NONE"} if backend.startswith("rediss://") else None,
)