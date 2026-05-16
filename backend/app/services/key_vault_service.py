from app.core.config import settings


class KeyVaultService:
    def get_secret(self, name: str) -> str | None:
        if settings.azure_key_vault_url:
            try:
                from azure.identity import DefaultAzureCredential
                from azure.keyvault.secrets import SecretClient

                client = SecretClient(
                    vault_url=settings.azure_key_vault_url,
                    credential=DefaultAzureCredential(),
                )
                return client.get_secret(name).value
            except Exception:
                return None
        return None
