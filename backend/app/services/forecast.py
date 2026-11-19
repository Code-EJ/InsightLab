"""Projeção diária Ridge e avaliação cronológica contra baseline sazonal."""

from typing import Literal

import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, root_mean_squared_error

from app.schemas.analytics import Forecast, ForecastErrors, Period, RevenuePoint
from app.services.analytics import Selection, daily_revenue

MIN_TRAIN_DAYS = 60


def calendar_features(index: pd.DatetimeIndex, origin: pd.Timestamp) -> np.ndarray:
    """Transforma datas em dias decorridos em escala de 30 dias e sete indicadores de dia da semana."""
    weekday = np.eye(7)[index.day_of_week]
    elapsed = (index - origin).days.to_numpy()
    return np.column_stack((elapsed / 30, weekday))


def points(index: pd.DatetimeIndex, values: np.ndarray) -> list[RevenuePoint]:
    return [RevenuePoint(date=day.date(), revenue=round(float(value), 2)) for day, value in zip(index, values, strict=True)]


def errors(observed: np.ndarray, predicted: np.ndarray) -> ForecastErrors:
    return ForecastErrors(
        mae=round(float(mean_absolute_error(observed, predicted)), 2),
        rmse=round(float(root_mean_squared_error(observed, predicted)), 2),
    )


def forecast(selection: Selection, horizon: Literal[7, 30]) -> Forecast:
    """Avalia o horizonte em dados reservados e projeta após o fim da seleção.

    Treina com o trecho anterior à janela de teste e compara o erro com a
    última semana do treino repetida. Ajusta novamente com todo o histórico
    somente para a projeção final. Histórico curto retorna projeção vazia.
    """
    start, end = selection.period.start, selection.period.end
    series = daily_revenue(selection.current, start, end)
    index = series.index
    values = series.to_numpy() / 100
    history = points(index[-120:], values[-120:])
    minimum = MIN_TRAIN_DAYS + horizon
    if len(series) < minimum or np.count_nonzero(values[:-horizon]) < 14:
        return Forecast(
            horizon=horizon, history=history, projection=[],
            message=f"Selecione pelo menos {minimum} dias, com receita positiva em pelo menos 14 dias antes da janela de teste.",
        )
    features = calendar_features(index, index[0])
    train, test = values[:-horizon], values[-horizon:]
    model = Ridge(alpha=1.0).fit(features[:-horizon], train)
    test_prediction = np.maximum(0, model.predict(features[-horizon:]))
    baseline = np.resize(train[-7:], horizon)
    future_index = pd.date_range(index[-1] + pd.Timedelta(days=1), periods=horizon)
    model.fit(features, values)
    future_prediction = np.maximum(0, model.predict(calendar_features(future_index, index[0])))
    return Forecast(
        horizon=horizon, history=history, projection=points(future_index, future_prediction),
        test_period=Period(start=index[-horizon].date(), end=index[-1].date()),
        model_errors=errors(test, test_prediction), baseline_errors=errors(test, baseline),
        message="A projeção estima tendência e padrões semanais. Dias sem vendas no CSV entram como zero. Promoções, feriados e mudanças no negócio podem alterar o resultado.",
    )
