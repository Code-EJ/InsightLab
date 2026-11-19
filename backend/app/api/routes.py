"""Rotas HTTP que resolvem datasets e filtros para os serviços de análise."""

from functools import lru_cache
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, Response
from starlette.concurrency import run_in_threadpool

from app.core.config import MAX_UPLOAD_BYTES
from app.models.dataset import Dataset
from app.schemas.analytics import (
    Customers,
    DatasetInfo,
    Filters,
    Forecast,
    ImportResult,
    Products,
    SalesSeries,
    Scenario,
    ScenarioInput,
    Summary,
)
from app.services import analytics
from app.services.analytics import Selection
from app.services.forecast import forecast
from app.services.imports import parse_csv, with_revenue
from data.generate_demo import generate_demo

router = APIRouter(prefix="/api")


@lru_cache(maxsize=1)
def get_demo() -> Dataset:
    """Gera e normaliza a base sintética uma vez por processo."""
    return Dataset(with_revenue(generate_demo()), demo=True)


def get_dataset(request: Request, x_dataset_id: Annotated[str | None, Header(max_length=32)] = None) -> Dataset:
    """Resolve a chave de posse ou usa a demo quando o cabeçalho é omitido.

    Raises:
        HTTPException: 404 se a chave informada for desconhecida ou expirada.
    """
    dataset = request.app.state.datasets.get(x_dataset_id)
    if dataset is None:
        raise HTTPException(404, "O conjunto importado expirou ou foi removido. Importe o CSV novamente.")
    return dataset


DatasetDependency = Annotated[Dataset, Depends(get_dataset)]


def validated_selection(dataset: Dataset, filters: Filters) -> Selection:
    """Converte um recorte inválido do serviço em erro HTTP 422."""
    try:
        return analytics.select(dataset, filters)
    except ValueError as error:
        raise HTTPException(422, str(error)) from error


def get_selection(dataset: DatasetDependency, filters: Annotated[Filters, Query()]) -> Selection:
    return validated_selection(dataset, filters)


SelectionDependency = Annotated[Selection, Depends(get_selection)]


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/dataset")
def dataset_info(dataset: DatasetDependency) -> DatasetInfo:
    return analytics.metadata(dataset)


@router.get("/summary")
def summary(selection: SelectionDependency) -> Summary:
    return analytics.summarize(selection)


@router.get("/sales")
def sales(selection: SelectionDependency, group: Literal["day", "week", "month"] = "week") -> SalesSeries:
    return analytics.sales_series(selection, group)


@router.get("/products")
def products(selection: SelectionDependency) -> Products:
    return analytics.breakdown(selection)


@router.get("/customers")
def customers(selection: SelectionDependency) -> Customers:
    return analytics.customers(selection)


@router.get("/forecast")
def project(selection: SelectionDependency, horizon: Literal["7", "30"] = "30") -> Forecast:
    return forecast(selection, 7 if horizon == "7" else 30)


@router.post("/scenario")
def scenario(parameters: ScenarioInput, dataset: DatasetDependency) -> Scenario:
    return analytics.simulate(validated_selection(dataset, parameters), parameters)


@router.post(
    "/datasets", status_code=201,
    openapi_extra={"requestBody": {"required": True, "content": {"text/csv": {"schema": {"type": "string", "format": "binary"}}}}},
)
async def upload(request: Request) -> ImportResult:
    """Valida um upload bruto de CSV e devolve a chave e os metadados.

    Lê até o limite de bytes antes de delegar o parser à thread pool.
    Só registra a base depois que conteúdo e metadados foram validados.

    Raises:
        HTTPException: 415 para mídia inválida, 413 para tamanho excessivo,
            422 para conteúdo inválido ou 503 quando o store estiver cheio.
    """
    mime = request.headers.get("content-type", "").split(";", 1)[0].strip().lower()
    if mime not in {"text/csv", "application/csv"}:
        raise HTTPException(415, "Envie um arquivo CSV com o tipo text/csv.")
    body = bytearray()
    async for chunk in request.stream():
        if len(body) + len(chunk) > MAX_UPLOAD_BYTES:
            raise HTTPException(413, "O arquivo excede o limite de 5 MB.")
        body.extend(chunk)
    try:
        frame = await run_in_threadpool(parse_csv, bytes(body))
    except ValueError as error:
        raise HTTPException(422, str(error)) from error
    dataset = Dataset(frame, demo=False)
    info = await run_in_threadpool(analytics.metadata, dataset)
    key = request.app.state.datasets.add(dataset)
    if key is None:
        raise HTTPException(503, "O limite de conjuntos temporários foi atingido. Tente mais tarde.")
    return ImportResult(dataset_id=key, info=info)


@router.delete("/datasets", status_code=204)
def remove(request: Request, x_dataset_id: Annotated[str, Header(max_length=32)]) -> Response:
    """Descarta a base da chave enviada e retorna 204 mesmo após expiração."""
    request.app.state.datasets.remove(x_dataset_id)
    return Response(status_code=204)
