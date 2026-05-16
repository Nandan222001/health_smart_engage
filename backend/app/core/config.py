from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "HSE Safety Compliance Intelligence API"
    app_version: str = "0.1.0"
    app_env: str = "local"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    database_url: str = Field(
        default="mysql+pymysql://hse_user:hse_password@localhost:3306/hse",
        validation_alias="DATABASE_URL",
    )

    jwt_issuer: str = "hse-platform"
    jwt_audience: str = "hse-users"
    jwt_secret: str = "replace-with-azure-key-vault-secret"
    jwt_algorithm: str = "HS256"
    oidc_jwks_url: str = ""
    access_token_expire_minutes: int = 60

    allowed_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    azure_storage_account: str = ""
    azure_storage_connection_string: str = ""
    azure_storage_container: str = "evidence"
    azure_key_vault_url: str = ""
    azure_email_endpoint: str = ""
    ai_endpoint: str = ""
    ai_api_key_secret_name: str = "ai-api-key"

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
