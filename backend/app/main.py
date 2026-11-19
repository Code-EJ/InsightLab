"""Aplicação ASGI, ciclo de vida das bases e políticas HTTP compartilhadas."""

import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import get_demo, router
from app.core.config import CORS_ORIGINS
from app.models.dataset import DatasetStore


async def expire_imports(store: DatasetStore) -> None:
    """Libera bases expiradas mesmo em períodos sem tráfego."""
    while True:
        await asyncio.sleep(60)
        store.expire()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Instala um store por processo e encerra a tarefa de limpeza no shutdown."""
    store = DatasetStore(get_demo())
    app.state.datasets = store
    cleanup = asyncio.create_task(expire_imports(store))
    try:
        yield
    finally:
        cleanup.cancel()
        with suppress(asyncio.CancelledError):
            await cleanup


app = FastAPI(
    title="InsightLab API",
    version="0.1.0",
    contact={"name": "oEnzoRibas", "url": "https://github.com/oEnzoRibas"},
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "X-Dataset-Id"],
)


@app.middleware("http")
async def no_cache(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    return response


@app.exception_handler(RequestValidationError)
async def invalid_parameters(_request: Request, error: RequestValidationError) -> JSONResponse:
    """Retorna os nomes dos campos inválidos sem divulgar seus valores."""
    fields = ", ".join(dict.fromkeys(str(item["loc"][-1]) for item in error.errors()))
    return JSONResponse(status_code=422, content={"detail": f"Verifique os parâmetros informados ({fields})."})


app.include_router(router)
