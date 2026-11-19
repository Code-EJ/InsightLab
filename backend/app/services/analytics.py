"""Seleção e agregações de vendas, clientes, produtos e cenários hipotéticos."""

from dataclasses import dataclass
from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal
from typing import Literal

import pandas as pd

from app.models.dataset import Dataset
from app.schemas.analytics import (
    Category,
    Customers,
    DatasetInfo,
    Filters,
    Metrics,
    Period,
    Product,
    Products,
    SalesSeries,
    Scenario,
    ScenarioInput,
    Segment,
    SeriesPoint,
    Summary,
)


@dataclass
class Selection:
    """DataFrame já filtrado por dimensões e janelas inclusivas atual e anterior."""
    frame: pd.DataFrame
    info: DatasetInfo
    period: Period
    previous_period: Period | None

    def during(self, period: Period) -> pd.DataFrame:
        return self.frame.loc[self.frame["date"].between(pd.Timestamp(period.start), pd.Timestamp(period.end))]

    @property
    def current(self) -> pd.DataFrame:
        return self.during(self.period)

    @property
    def previous(self) -> pd.DataFrame | None:
        return self.during(self.previous_period) if self.previous_period else None


def metadata(dataset: Dataset) -> DatasetInfo:
    frame = dataset.frame
    return DatasetInfo(
        start=frame["date"].min().date(), end=frame["date"].max().date(),
        demo=dataset.demo, rows=len(frame), has_customers=bool(frame["customer_id"].notna().any()),
        categories={
            str(name): sorted(group["product"].unique())
            for name, group in frame.groupby("category", sort=True)
        },
    )


def select(dataset: Dataset, filters: Filters) -> Selection:
    """Prepara o recorte de uma base normalizada com os filtros fornecidos.

    Usa os últimos 90 dias por padrão. O período anterior precisa caber
    integralmente na base e ter a mesma duração da janela atual.

    Raises:
        ValueError: O recorte solicitado não cabe no intervalo observado.
    """
    info = metadata(dataset)
    start = filters.start or max(info.start, info.end - timedelta(days=89))
    end = filters.end or info.end
    if not info.start <= start <= end <= info.end:
        raise ValueError("Escolha um período dentro das datas do conjunto de dados.")
    frame = dataset.frame
    if filters.category:
        frame = frame.loc[frame["category"] == filters.category]
    if filters.product:
        frame = frame.loc[frame["product"] == filters.product]
    length = end - start + timedelta(days=1)
    prior = None
    if start - length >= info.start:
        prior = Period(start=start - length, end=start - timedelta(days=1))
    return Selection(frame, info, Period(start=start, end=end), prior)


def calculate_metrics(frame: pd.DataFrame) -> Metrics:
    """Soma centavos, conta pedidos distintos e calcula ticket por pedido no recorte."""
    revenue = int(frame["revenue_cents"].sum()) / 100
    orders = int(frame["order_id"].nunique())
    return Metrics(revenue=revenue, orders=orders, average_ticket=round(revenue / orders, 2) if orders else 0, units=int(frame["quantity"].sum()))


def growth(current: float, previous: float | None) -> float | None:
    """Retorna a variação percentual quando existe um denominador diferente de zero."""
    return round(100 * (current - previous) / previous, 2) if previous else None


def breakdown(selection: Selection) -> Products:
    """Agrupa receita e unidades por dimensões e classifica produtos por receita acumulada.

    Mantém produtos da janela anterior para representar itens que deixaram de vender.
    """
    current, previous = selection.current, selection.previous
    total = int(current["revenue_cents"].sum())
    categories = current.groupby("category")["revenue_cents"].sum().sort_values(ascending=False, kind="stable")
    keys = ["category", "product"]
    grouped = current.groupby(keys).agg(revenue_cents=("revenue_cents", "sum"), units=("quantity", "sum"))
    prior = previous.groupby(keys)["revenue_cents"].sum() if previous is not None else None
    if prior is not None:
        grouped = grouped.reindex(grouped.index.union(prior.index), fill_value=0)
    grouped = grouped.sort_values("revenue_cents", ascending=False, kind="stable")
    cumulative = 0
    products = []
    for (category, name), row in grouped.iterrows():
        cents = int(row.revenue_cents)
        abc = "C" if not cents or cumulative >= total * 0.95 else "B" if cumulative >= total * 0.80 else "A"
        cumulative += cents
        products.append(Product(
            name=name, category=category, revenue=cents / 100, units=int(row.units),
            share=round(100 * cents / total, 2) if total else 0,
            cumulative_share=round(100 * cumulative / total, 2) if total else 0,
            abc=abc, growth=growth(cents, prior.get((category, name)) if prior is not None else None),
        ))
    return Products(
        products=products,
        categories=[
            Category(name=name, revenue=int(cents) / 100, share=round(100 * cents / total, 2) if total else 0)
            for name, cents in categories.items()
        ],
    )


def summarize(selection: Selection) -> Summary:
    """Reúne KPIs, comparação, categorias e até cinco produtos por unidades vendidas."""
    current = calculate_metrics(selection.current)
    previous = calculate_metrics(selection.previous) if selection.previous_period else None
    products = breakdown(selection)
    return Summary(
        period=selection.period, previous_period=selection.previous_period,
        current=current, previous=previous, revenue_growth=growth(current.revenue, previous.revenue if previous else None),
        orders_growth=growth(current.orders, previous.orders if previous else None),
        ticket_growth=growth(current.average_ticket, previous.average_ticket if previous else None),
        categories=products.categories, top_products=sorted(
            (product for product in products.products if product.units),
            key=lambda product: (-product.units, -product.revenue, product.name),
        )[:5],
    )


def daily_revenue(frame: pd.DataFrame, start: date, end: date) -> pd.Series:
    """Retorna centavos por dia em índice contínuo, com zero nos dias sem vendas."""
    return frame.groupby("date")["revenue_cents"].sum().reindex(pd.date_range(start, end), fill_value=0)


def sales_series(selection: Selection, group: Literal["day", "week", "month"]) -> SalesSeries:
    """Alinha a janela anterior por deslocamento diário antes de agrupar.

    Semanas começam na segunda-feira. Os limites do recorte podem formar
    semanas ou meses parciais. Os valores de saída são expressos em reais.
    """
    start, end = selection.period.start, selection.period.end
    current = daily_revenue(selection.current, start, end)
    prior = selection.previous_period
    frame = current.to_frame("revenue")
    if prior:
        frame["previous"] = daily_revenue(selection.previous, prior.start, prior.end).to_numpy()
    if group != "day":
        periods = frame.index.to_period("W-SUN" if group == "week" else "M")
        frame = frame.groupby(periods).sum()
        frame.index = frame.index.start_time
    offset = start - prior.start if prior else None
    return SalesSeries(points=[
        SeriesPoint(
            date=max(day.date(), start), revenue=int(row.revenue) / 100,
            previous_date=max(day.date(), start) - offset if offset else None,
            previous_revenue=int(row.previous) / 100 if offset else None,
        )
        for day, row in frame.iterrows()
    ])


def customers(selection: Selection) -> Customers:
    """Calcula frequência e segmentos por pedidos distintos com cliente identificado.

    A cobertura usa o total de pedidos do recorte, inclusive sem ID de cliente.
    """
    current = selection.current
    identified = current.loc[current["customer_id"].notna()]
    orders = identified.groupby("customer_id")["order_id"].nunique()
    unique = len(orders)
    recurring = int(orders.gt(1).sum())
    measured = calculate_metrics(identified)
    all_orders = current["order_id"].nunique()
    return Customers(
        unique=unique, recurring=recurring, coverage=round(100 * measured.orders / all_orders, 2) if all_orders else 0,
        frequency=round(float(orders.mean()), 2) if unique else None,
        average_ticket=measured.average_ticket if unique else None,
        revenue_per_customer=round(measured.revenue / unique, 2) if unique else None,
        segments=[
            Segment(name="Compra única", customers=unique - recurring),
            Segment(name="Recorrentes", customers=int(orders.between(2, 4).sum())),
            Segment(name="Frequentes", customers=int(orders.ge(5).sum())),
        ] if unique else [],
    )


def simulate(selection: Selection, parameters: ScenarioInput) -> Scenario:
    """Aplica as premissas a pedidos e ticket, preservando a precisão do ticket no produto final."""
    base = calculate_metrics(selection.current)
    orders = base.orders if parameters.order_volume is None else parameters.order_volume
    simulated_orders = round(orders * (1 + parameters.sales_growth / 100))
    ticket_cents = Decimal(int(selection.current["revenue_cents"].sum())) / base.orders if base.orders else Decimal(0)
    adjusted_ticket = ticket_cents * (1 + Decimal(str(parameters.ticket_change)) / 100)
    simulated_ticket = float(adjusted_ticket.quantize(Decimal("1"), rounding=ROUND_HALF_UP) / 100)
    revenue = float((simulated_orders * adjusted_ticket).quantize(Decimal("1"), rounding=ROUND_HALF_UP) / 100)
    return Scenario(
        base=base, simulated_orders=simulated_orders, simulated_ticket=simulated_ticket,
        simulated_revenue=revenue, difference=round(revenue - base.revenue, 2),
        change=growth(revenue, base.revenue),
    )
