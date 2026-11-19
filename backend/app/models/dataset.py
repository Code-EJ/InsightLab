"""Representações e armazenamento dos datasets no processo da API."""

from dataclasses import dataclass
from threading import Lock
from time import monotonic
from uuid import uuid4

import pandas as pd

from app.core.config import DATASET_SLOTS, DATASET_TTL


@dataclass(frozen=True)
class Dataset:
    """Base normalizada. Consumidores devem tratar o DataFrame compartilhado como imutável."""
    frame: pd.DataFrame
    demo: bool


class DatasetStore:
    """Mantém a demo e as importações temporárias sob um lock de processo.

    Os prazos usam relógio monotônico e começam no momento da inserção.
    """
    def __init__(self, demo: Dataset):
        self.demo = demo
        self._imports: dict[str, tuple[float, Dataset]] = {}
        self._lock = Lock()

    def _expire(self, now: float) -> None:
        for key, (expires, _) in list(self._imports.items()):
            if expires <= now:
                del self._imports[key]

    def expire(self) -> None:
        with self._lock:
            self._expire(monotonic())

    def add(self, dataset: Dataset) -> str | None:
        """Registra a base validada e retorna a chave, ou None sem slot disponível."""
        with self._lock:
            now = monotonic()
            self._expire(now)
            if len(self._imports) >= DATASET_SLOTS:
                return None
            key = uuid4().hex
            self._imports[key] = (now + DATASET_TTL, dataset)
            return key

    def get(self, key: str | None) -> Dataset | None:
        """Retorna a demo para chave ausente ou a base ativa correspondente."""
        if key is None:
            return self.demo
        with self._lock:
            self._expire(monotonic())
            entry = self._imports.get(key)
            return entry[1] if entry else None

    def remove(self, key: str) -> None:
        with self._lock:
            self._imports.pop(key, None)
