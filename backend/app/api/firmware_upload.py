"""
File upload endpoint for firmware analysis
"""
from fastapi import UploadFile, File
import os
import shutil
from pathlib import Path
import uuid as uuid_lib
import asyncio

UPLOAD_DIR = "/tmp/firmware_uploads"


async def save_upload_file(upload_file: UploadFile, destination: Path) -> None:
    """Save uploaded file to destination"""
    try:
        with destination.open("wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
    finally:
        upload_file.file.close()


def add_firmware_upload_endpoint(router):
    """Add firmware upload endpoint to router"""
    
    @router.post("/firmware/upload")
    async def upload_firmware(
        file: UploadFile = File(...),
        project_id: str = None,
        current_user: User = Depends(get_current_active_user)
    ):
        """
        Upload firmware file for analysis
        
        - Max size: 500MB
        - Supported formats: .bin, .img, .zip, .tar.gz, .tar, .fw
        - Returns: File path for use in task creation
        """
        # Validate file extension
        allowed_extensions = {'.bin', '.img', '.zip', '.gz', '.tar', '.fw', '.elf'}
        file_ext = Path(file.filename).suffix.lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {file_ext}. Allowed: {', '.join(allowed_extensions)}"
            )
        
        #  Validate file size (max 500MB)
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        max_size = 500 * 1024 * 1024  # 500MB
        if file_size > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large: {file_size / (1024*1024):.2f}MB. Max: 500MB"
            )
        
        # Create unique directory for this upload
        upload_id = str(uuid_lib.uuid4())
        upload_path = Path(UPLOAD_DIR) / upload_id
        upload_path.mkdir(parents=True, exist_ok=True)
        
        # Save file
        file_path = upload_path / file.filename
        await save_upload_file(file, file_path)
        
        return {
            "code": 200,
            "message": "Firmware uploaded successfully",
            "data": {
                "upload_id": upload_id,
                "filename": file.filename,
                "file_path": str(file_path),
                "size": file_size,
                "size_mb": round(file_size / (1024 * 102), 2)
            }
        }


# Export the function
__all__ = ['add_firmware_upload_endpoint']
