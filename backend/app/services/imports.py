"""Validação de CSV de itens de pedido e normalização para a análise."""

import csv
import io
import re
from datetime import date
from decimal import Decimal

import pandas as pd

from app.core.config import MAX_HISTORY_DAYS, MAX_ROWS

REQUIRED = {"date", "order_id", "product", "category", "quantity", "unit_price"}
ALIASES = {
    "data_venda": "date", "id_pedido": "order_id", "produto": "product",
    "categoria": "category", "quantidade": "quantity", "preco_unitario": "unit_price",
    "id_cliente": "customer_id",
}


def with_revenue(frame: pd.DataFrame) -> pd.DataFrame:
    """Deriva centavos inteiros de unit_price e quantity sem alterar o frame de entrada."""
    # Store centavos as integers for exact line and revenue totals.
    cents = (frame["unit_price"] * 100).round().astype("int64")
    return frame.assign(revenue_cents=cents * frame["quantity"])


def parse_csv(payload: bytes) -> pd.DataFrame:
    """Converte bytes de CSV em um DataFrame normalizado de itens de pedido.

    Espera que a rota tenha limitado o número de bytes. Normaliza cabeçalhos,
    valida datas e valores e aproveita IDs de cliente nas demais linhas do pedido.

    Returns:
        Base pronta para agregação, com receita em centavos e ID opcional.

    Raises:
        ValueError: Codificação, colunas, linhas ou limites de conteúdo inválidos.
    """
    try:
        data = payload.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise ValueError("Salve o CSV com codificação UTF-8.") from error
    if not data.strip() or "\x00" in data:
        raise ValueError("Envie um CSV de texto com cabeçalho e pelo menos uma venda.")
    header = data.splitlines()[0]
    delimiter = ";" if header.count(";") > header.count(",") else ","
    reader = csv.reader(io.StringIO(data, newline=""), delimiter=delimiter, strict=True)
    try:
        names = [name.strip().lower() for name in next(reader)]
        names = [ALIASES.get(name, name) for name in names]
        missing = sorted(REQUIRED - set(names))
        if missing:
            raise ValueError("Colunas obrigatórias ausentes: " + ", ".join(missing) + ".")
        if len(names) != len(set(names)) or set(names) - (REQUIRED | {"customer_id"}):
            raise ValueError("O cabeçalho contém colunas repetidas ou desconhecidas.")
        rows = []
        orders: dict[str, tuple[date, str]] = {}
        for values in reader:
            line = reader.line_num
            if not values:
                continue
            if len(rows) >= MAX_ROWS:
                raise ValueError(f"O CSV deve conter até {MAX_ROWS:,} linhas de vendas.")
            if len(values) != len(names):
                raise ValueError(f"Linha {line}: quantidade de campos diferente do cabeçalho.")
            row = dict(zip(names, (value.strip() for value in values), strict=True))
            for name in ("order_id", "product", "category"):
                if not row[name] or len(row[name]) > 100 or not row[name].isprintable():
                    raise ValueError(f"Linha {line}: {name} deve ter entre 1 e 100 caracteres válidos.")
            customer = row.get("customer_id", "")
            if len(customer) > 100 or (customer and not customer.isprintable()):
                raise ValueError(f"Linha {line}: identificador do cliente inválido.")
            try:
                if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", row["date"]):
                    raise ValueError()
                day = date.fromisoformat(row["date"])
                if not 1900 <= day.year <= 2200:
                    raise ValueError()
            except ValueError as error:
                raise ValueError(f"Linha {line}: use uma data válida no formato AAAA-MM-DD (1900–2200).") from error
            if not re.fullmatch(r"[0-9]{1,5}", row["quantity"]) or not 1 <= int(row["quantity"]) <= 10_000:
                raise ValueError(f"Linha {line}: quantity deve ser um inteiro de 1 a 10.000.")
            price = row["unit_price"].replace(",", ".") if delimiter == ";" else row["unit_price"]
            if not re.fullmatch(r"[0-9]{1,7}(?:\.[0-9]{1,2})?", price):
                raise ValueError(f"Linha {line}: unit_price deve ser um preço não negativo com até duas casas decimais.")
            order = row["order_id"]
            saved_day, saved_customer = orders.get(order, (day, ""))
            if saved_day != day or (saved_customer and customer and saved_customer != customer):
                raise ValueError(f"Linha {line}: o pedido tem data ou cliente incompatível com outra linha.")
            orders[order] = (day, saved_customer or customer)
            rows.append((day, order, row["product"], row["category"], int(row["quantity"]), float(Decimal(price))))
    except csv.Error as error:
        raise ValueError(f"CSV malformado próximo à linha {reader.line_num}.") from error
    if not rows:
        raise ValueError("Nenhuma linha de vendas foi encontrada.")
    frame = pd.DataFrame(rows, columns=["date", "order_id", "product", "category", "quantity", "unit_price"])
    if (frame["date"].max() - frame["date"].min()).days + 1 > MAX_HISTORY_DAYS:
        raise ValueError("O intervalo entre a primeira e a última venda deve ter até 10 anos.")
    if frame["product"].nunique() > 1000 or frame["category"].nunique() > 100:
        raise ValueError("O CSV pode conter até 1.000 produtos e 100 categorias.")
    frame["date"] = pd.to_datetime(frame["date"])
    frame["customer_id"] = frame["order_id"].map({key: customer or None for key, (_, customer) in orders.items()})
    return with_revenue(frame)
