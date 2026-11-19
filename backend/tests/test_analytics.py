from datetime import date

import pandas as pd
import pytest

from app.models.dataset import Dataset
from app.schemas.analytics import Filters, ScenarioInput
from app.services.analytics import customers, sales_series, select, simulate, summarize
from app.services.forecast import forecast
from app.services.imports import parse_csv, with_revenue
from data.generate_demo import generate_demo

CSV = """date;order_id;product;category;quantity;unit_price;customer_id
2026-05-01;1;Lâmpada;Casa;1;10,25;A01
2026-05-02;2;Vaso;Casa;2;20;A01
2026-05-03;3;Lâmpada;Casa;3;10,25;
2026-05-03;3;Vaso;Casa;1;20;A01
2026-05-04;4;Meia;Moda;1;10;B01
""".encode()


@pytest.fixture(scope="module")
def sample():
    return Dataset(parse_csv(CSV), demo=False)


def test_metrics_comparison_and_ranking(sample):
    selection = select(sample, Filters(start=date(2026, 5, 3), end=date(2026, 5, 4)))
    summary = summarize(selection)
    assert summary.current.revenue == 60.75
    assert summary.current.orders == 2
    assert summary.current.units == 5
    assert summary.current.average_ticket == 30.38
    assert summary.previous.revenue == 50.25
    assert summary.revenue_growth == 20.9
    assert summary.top_products[0].name == "Lâmpada"
    assert summary.top_products[0].growth == 200
    assert summary.categories[0].share == 83.54


def test_series_preserves_totals_and_aligns_previous_days(sample):
    selection = select(sample, Filters(start=date(2026, 5, 3), end=date(2026, 5, 4), category="Casa"))
    daily = sales_series(selection, "day").points
    assert [point.revenue for point in daily] == [50.75, 0]
    assert [point.previous_revenue for point in daily] == [10.25, 40]
    assert daily[0].previous_date == date(2026, 5, 1)
    monthly = sales_series(selection, "month").points
    assert len(monthly) == 1
    assert monthly[0].revenue == 50.75
    assert monthly[0].previous_revenue == 50.25


def test_customers_are_counted_per_order_and_missing_ids_can_be_inferred(sample):
    result = customers(select(sample, Filters()))
    assert result.unique == 2
    assert result.recurring == 1
    assert result.frequency == 2
    assert result.coverage == 100
    assert [segment.customers for segment in result.segments] == [1, 1, 0]


def test_scenario_keeps_base_with_no_changes(sample):
    selection = select(sample, Filters())
    assert simulate(selection, ScenarioInput()).difference == 0
    result = simulate(selection, ScenarioInput(sales_growth=20, ticket_change=50, order_volume=10))
    assert result.simulated_orders == 12
    assert result.simulated_ticket == 41.63
    assert result.simulated_revenue == 499.50


@pytest.mark.parametrize("content, error", [
    (b"date,order_id\n2026-04-01,1", "Colunas obrigatórias"),
    (b"\xff", "UTF-8"),
    (CSV.replace(b"2026-05-01", b"2026-05-99"), "data válida"),
    (CSV.replace(b"1;10,25", b"-1;10,25"), "quantity"),
    (CSV.replace(b"2026-05-02;2", b"2026-05-02;1"), "incompatível"),
])
def test_invalid_upload(content, error):
    with pytest.raises(ValueError, match=error):
        parse_csv(content)


def test_demo_is_seeded_and_spans_more_than_a_year():
    first = generate_demo()
    pd.testing.assert_frame_equal(first, generate_demo())
    assert (first.date.max() - first.date.min()).days > 365
    assert first.category.nunique() >= 4


@pytest.mark.parametrize("horizon", [7, 30])
def test_forecast_temporal_split_and_baseline(horizon):
    dates = pd.date_range("2026-01-01", periods=100)
    frame = pd.DataFrame({
        "date": dates, "order_id": dates.astype(str), "product": "P", "category": "C",
        "customer_id": None, "unit_price": 12.50, "quantity": 1,
    })
    selection = select(Dataset(with_revenue(frame), demo=False), Filters(start=dates[0].date(), end=dates[-1].date()))
    result = forecast(selection, horizon)
    assert result.test_period.start == dates[-horizon].date()
    assert result.test_period.end == dates[-1].date()
    assert result.model_errors.mae == 0
    assert result.baseline_errors.rmse == 0
    assert len(result.projection) == horizon
    assert result.projection[0].date == dates[-1].date() + pd.Timedelta(days=1)
    assert all(point.revenue == 12.50 for point in result.projection)

    changed = frame.assign(unit_price=frame["unit_price"].where(frame["date"] < dates[-horizon], 25.0))
    changed_selection = select(Dataset(with_revenue(changed), demo=False), Filters(start=dates[0].date(), end=dates[-1].date()))
    held_out = forecast(changed_selection, horizon)
    assert held_out.model_errors.mae == 12.50
    assert held_out.baseline_errors.rmse == 12.50


def test_forecast_insufficient_history(sample):
    result = forecast(select(sample, Filters()), 7)
    assert result.projection == []
    assert result.model_errors is None
    assert "67 dias" in result.message
