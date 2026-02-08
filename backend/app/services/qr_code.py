"""
QR Code generation and MinIO storage service
"""
from minio import Minio
from minio.error import S3Error
import qrcode
from io import BytesIO
from datetime import datetime
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class QRCodeService:
    """QR code generation and storage service"""
    
    def __init__(self):
        """Initialize MinIO client (gracefully handles unavailability)"""
        self.client = None
        self.bucket_name = settings.MINIO_BUCKET
        self._available = False
        
        try:
            self.client = Minio(
                settings.MINIO_ENDPOINT,
                access_key=settings.MINIO_ROOT_USER,
                secret_key=settings.MINIO_ROOT_PASSWORD,
                secure=settings.MINIO_USE_SSL
            )
            self._ensure_bucket()
            self._available = True
            logger.info("MinIO connection established successfully")
        except Exception as e:
            logger.warning(f"MinIO not available, QR code generation disabled: {e}")
    
    def _ensure_bucket(self):
        """Ensure bucket exists"""
        if not self.client:
            return
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"Created MinIO bucket: {self.bucket_name}")
        except S3Error as e:
            logger.error(f"Error ensuring bucket exists: {e}")
    
    def generate_qr_code(self, sample_code: str) -> str:
        """
        Generate QR code for sample and upload to MinIO
        
        Args:
            sample_code: Sample code (e.g., SPL-20251216-001)
        
        Returns:
            Public URL of the QR code image, or empty string if MinIO unavailable
        """
        if not self._available:
            logger.warning("MinIO not available, skipping QR code generation")
            return ""
        try:
            # Generate QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            
            # QR code content: could be URL or just code
            # For now, just use the sample code
            qr_content = f"SAMPLE:{sample_code}"
            qr.add_data(qr_content)
            qr.make(fit=True)
            
            # Create image
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Save to buffer
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            
            # Generate object path
            now = datetime.now()
            year = now.strftime('%Y')
            month = now.strftime('%m')
            object_name = f"qrcodes/{year}/{month}/{sample_code}.png"
            
            # Upload to MinIO
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                data=buffer,
                length=buffer.getbuffer().nbytes,
                content_type='image/png'
            )
            
            # Generate public URL
            # Use MINIO_PUBLIC_URL for browser access, fallback to MINIO_ENDPOINT
            public_host = settings.MINIO_PUBLIC_URL or f"http://{settings.MINIO_ENDPOINT}"
            url = f"{public_host}/{self.bucket_name}/{object_name}"
            
            logger.info(f"Generated QR code for {sample_code}: {url}")
            return url
            
        except Exception as e:
            logger.error(f"Error generating QR code for {sample_code}: {e}")
            raise
    
    def delete_qr_code(self, qr_code_url: str):
        """
        Delete QR code from MinIO
        
        Args:
            qr_code_url: Full URL of the QR code
        """
        try:
            # Extract object name from URL
            # Format: http://localhost:9000/bucket/qrcodes/2025/12/SPL-xxx.png
            parts = qr_code_url.split(f"/{self.bucket_name}/")
            if len(parts) != 2:
                logger.warning(f"Invalid QR code URL format: {qr_code_url}")
                return
            
            object_name = parts[1]
            
            # Delete from MinIO
            self.client.remove_object(self.bucket_name, object_name)
            logger.info(f"Deleted QR code: {object_name}")
            
        except Exception as e:
            logger.error(f"Error deleting QR code {qr_code_url}: {e}")


# Singleton instance
qr_service = QRCodeService()
