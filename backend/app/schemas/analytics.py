"""Contratos Pydantic da API. Quantias no JSON são expressas em reais."""

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class Filters(BaseModel):
    """Recorte inclusivo com dimensões textuais e datas opcionais."""
    start: date | None = None
    end: date | None = None
    category: str | None = Field(None, max_length=100)
    product: str | None = Field(None, max_length=100)

    @model_validator(mode="after")
    def check_dates(self):
        if self.start and self.end and self.start > self.end:
            raise ValueError("A data inicial deve anteceder ou coincidir com a final.")
        return self


class Period(BaseModel):
    start: date
    end: date


class DatasetInfo(Period):
    demo: bool
    rows: int
    categories: dict[str, list[str]]
    has_customers: bool


class ImportResult(BaseModel):
    dataset_id: str
    info: DatasetInfo


class Metrics(BaseModel):
    revenue: float
    orders: int
    average_ticket: float
    units: int


class Category(BaseModel):
    name: str
    revenue: float
    share: float


class Product(Category):
    category: str
    units: int
    growth: float | None
    cumulative_share: float
    abc: Literal["A", "B", "C"]


class Summary(BaseModel):
    period: Period
    previous_period: Period | None
    current: Metrics
    previous: Metrics | None
    revenue_growth: float | None
    orders_growth: float | None
    ticket_growth: float | None
    categories: list[Category]
    top_products: list[Product]


class SeriesPoint(BaseModel):
    date: date
    revenue: float
    previous_date: date | None
    previous_revenue: float | None


class SalesSeries(BaseModel):
    points: list[SeriesPoint]


class Products(BaseModel):
    products: list[Product]
    categories: list[Category]


class Segment(BaseModel):
    name: str
    customers: int


class Customers(BaseModel):
    unique: int
    recurring: int
    coverage: float
    frequency: float | None
    average_ticket: float | None
    revenue_per_customer: float | None
    segments: list[Segment]


class RevenuePoint(BaseModel):
    date: date
    revenue: float


class ForecastErrors(BaseModel):
    mae: float
    rmse: float


class Forecast(BaseModel):
    """Histórico visível, projeção diária e erros da janela reservada, quando calculáveis."""
    history: list[RevenuePoint]
    projection: list[RevenuePoint]
    horizon: Literal[7, 30]
    test_period: Period | None = None
    model_errors: ForecastErrors | None = None
    baseline_errors: ForecastErrors | None = None
    message: str


class ScenarioInput(Filters):
    """Recorte e premissas hipotéticas. O volume opcional substitui a base de pedidos."""
    sales_growth: float = Field(0, ge=-100, le=300)
    ticket_change: float = Field(0, ge=-100, le=300)
    order_volume: int | None = Field(None, ge=0, le=1_000_000)


class Scenario(BaseModel):
    base: Metrics
    simulated_orders: int
    simulated_ticket: float
    simulated_revenue: float
    difference: float
    change: float | None
