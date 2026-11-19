"""Run from backend with python -m data.generate_demo."""
from pathlib import Path

import numpy as np
import pandas as pd

SEED = 42
CATALOG = {
    "Eletrônicos": [("Fone Bluetooth", 229), ("Teclado mecânico", 319), ("Carregador USB-C", 99)],
    "Casa e decoração": [("Luminária de mesa", 149), ("Kit de organização", 89), ("Vaso cerâmico", 119)],
    "Moda e acessórios": [("Mochila urbana", 179), ("Camiseta básica", 69), ("Boné clássico", 59)],
    "Esporte e lazer": [("Garrafa térmica", 109), ("Tapete de yoga", 129), ("Kit de faixas", 89)],
    "Beleza e cuidados": [("Kit de skincare", 139), ("Hidratante facial", 79), ("Sabonete líquido", 39)],
}


def generate_demo() -> pd.DataFrame:
    """Cria itens sintéticos reproduzíveis com sazonalidade e IDs fictícios.

    Retorna o DataFrame sem gravar arquivo. A escrita é exclusiva do modo script.
    """
    rng = np.random.default_rng(SEED)
    products = [(category, name, price) for category, items in CATALOG.items() for name, price in items]
    customers = [f"C{i:04}" for i in range(1, 1201)]
    weights = rng.lognormal(0, 0.9, len(customers))
    probabilities = weights / weights.sum()
    rows = []
    order = 0
    for day, date in enumerate(pd.date_range("2025-05-01", "2026-10-31")):
        seasonal = 1 + 0.16 * np.sin(day * 2 * np.pi / 32)
        holiday = 1.4 if date.month in (11, 12) else 1.0
        weekday = (0.86, 0.92, 1.0, 1.03, 1.15, 1.25, 0.79)[date.day_of_week]
        volume = 20 * (1 + 0.0016 * day) * seasonal * holiday * weekday
        for _ in range(rng.poisson(volume)):
            order += 1
            customer = rng.choice(customers, p=probabilities)
            for item in rng.choice(len(products), size=rng.choice([1, 2, 3], p=[0.75, 0.2, 0.05]), replace=False):
                category, name, price = products[item]
                discount = rng.choice([1, 0.9, 0.8], p=[0.83, 0.13, 0.04])
                rows.append((date, f"P{order:06}", name, category, int(rng.choice([1, 2, 3], p=[0.84, 0.13, 0.03])), round(price * discount, 2), customer))
    return pd.DataFrame(rows, columns=["date", "order_id", "product", "category", "quantity", "unit_price", "customer_id"])


if __name__ == "__main__":
    generate_demo().to_csv(Path(__file__).with_name("demo.csv"), index=False, date_format="%Y-%m-%d", encoding="utf-8")
