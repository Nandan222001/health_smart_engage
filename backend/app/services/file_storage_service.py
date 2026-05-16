from dataclasses import dataclass

from app.core.config import settings


@dataclass(frozen=True)
class UploadTarget:
    url: str
    method: str = "PUT"
    headers: dict[str, str] | None = None


class FileStorageService:
    def create_upload_target(self, file_name: str, content_type: str | None = None) -> UploadTarget:
        if settings.azure_storage_connection_string:
            try:
                from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions
                from datetime import UTC, datetime, timedelta

                service = BlobServiceClient.from_connection_string(settings.azure_storage_connection_string)
                blob = service.get_blob_client(settings.azure_storage_container, file_name)
                account_key = service.credential.account_key if hasattr(service.credential, "account_key") else None
                if account_key:
                    sas = generate_blob_sas(
                        account_name=blob.account_name,
                        container_name=settings.azure_storage_container,
                        blob_name=file_name,
                        account_key=account_key,
                        permission=BlobSasPermissions(write=True, create=True),
                        expiry=datetime.now(UTC) + timedelta(minutes=15),
                    )
                    return UploadTarget(
                        url=f"{blob.url}?{sas}",
                        headers={
                            "x-ms-blob-type": "BlockBlob",
                            "Content-Type": content_type or "application/octet-stream",
                        },
                    )
            except Exception:
                # Local fallback keeps API usable when Azure credentials are not configured.
                pass

        if not settings.azure_storage_account:
            return UploadTarget(
                url=f"local://{settings.azure_storage_container}/{file_name}",
                headers={"x-ms-blob-type": "BlockBlob"},
            )
        url = (
            f"https://{settings.azure_storage_account}.blob.core.windows.net/"
            f"{settings.azure_storage_container}/{file_name}"
        )
        return UploadTarget(url=url, headers={"x-ms-blob-type": "BlockBlob"})

    def metadata(self, file_id: str) -> dict:
        return {"fileId": file_id, "storage": "azure-blob", "container": settings.azure_storage_container}
