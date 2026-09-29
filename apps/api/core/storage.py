import os
import shutil
import aiofiles
from pathlib import Path
from apps.api.core.config import settings
from apps.api.core.logging import get_logger

logger = get_logger("vistaar.storage")

class StorageService:
    def __init__(self):
        self.base_dir = Path(settings.STORAGE_LOCAL_PATH).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)
        (self.base_dir / "documents").mkdir(exist_ok=True)
        (self.base_dir / "datasets").mkdir(exist_ok=True)
        (self.base_dir / "media").mkdir(exist_ok=True)
        (self.base_dir / "exports").mkdir(exist_ok=True)

    async def save_file(self, category: str, filename: str, content: bytes) -> str:
        target_dir = self.base_dir / category
        target_dir.mkdir(parents=True, exist_ok=True)
        # Prevent path traversal
        clean_filename = Path(filename).name
        target_path = target_dir / clean_filename
        
        async with aiofiles.open(target_path, "wb") as f:
            await f.write(content)
            
        logger.info(f"Saved file {clean_filename} to {category} storage.")
        return str(target_path)

    def get_file_path(self, category: str, filename: str) -> str:
        clean_filename = Path(filename).name
        return str(self.base_dir / category / clean_filename)

    def file_exists(self, category: str, filename: str) -> bool:
        clean_filename = Path(filename).name
        return (self.base_dir / category / clean_filename).exists()

storage_service = StorageService()
