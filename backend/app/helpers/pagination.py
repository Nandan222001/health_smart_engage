from dataclasses import dataclass


@dataclass(frozen=True)
class PaginationParams:
    page: int = 1
    page_size: int = 25
    sort: str | None = None
    filter: str | None = None

    @property
    def offset(self) -> int:
        return max(self.page - 1, 0) * self.page_size
