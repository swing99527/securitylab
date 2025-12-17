"""
Sample Management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid
import math

from app.core.deps import get_db, get_current_active_user
from app.models.models import User, Sample
from app.schemas.samples import (
    SampleCreate,
    SampleUpdate,
    SampleQuery,
    SampleResponse,
    SampleDetail,
    SampleListResponse,
    QRCodeResponse
)
from app.services import samples as sample_service
from datetime import datetime

router = APIRouter(prefix="/samples", tags=["Samples"])


@router.post("", response_model=SampleResponse, status_code=status.HTTP_201_CREATED)
async def create_sample(
    sample_data: SampleCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create new sample with auto-generated code and QR code
    
    - Auto-generates sample code: SPL-YYYYMMDD-NNN
    - Generates QR code and uploads to MinIO
    - Sets initial status to 'in_stock'
    - Requires authentication
    """
    sample = await sample_service.create_sample(db, sample_data)
    return sample


@router.get("", response_model=SampleListResponse)
async def list_samples(
    status_filter: str = None,
    project_id: str = None,
    search: str = None,
    page: int = 1,
    page_size: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List samples with pagination and filters
    
    - Filter by status, project, or search term
    - Paginated results (default 20 per page)
    - Sorted by creation date (newest first)
    """
    # Build query
    query = SampleQuery(
        status=status_filter,
        project_id=uuid.UUID(project_id) if project_id else None,
        search=search,
        page=page,
        page_size=min(page_size, 100)
    )
    
    samples, total = await sample_service.list_samples(db, query)
    
    total_pages = math.ceil(total / query.page_size) if total > 0 else 0
    
    return SampleListResponse(
        items=samples,
        total=total,
        page=query.page,
        page_size=query.page_size,
        total_pages=total_pages
    )


@router.get("/{sample_id}", response_model=SampleDetail)
async def get_sample(
    sample_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get sample details with project information
    
    - Returns full sample information
    - Includes QR code URL
    - Shows associated project
    """
    from sqlalchemy.orm import selectinload
    
    # Query sample with project relationship
    stmt = select(Sample).options(
        selectinload(Sample.project)
    ).where(Sample.id == sample_id)
    
    result = await db.execute(stmt)
    sample = result.scalar_one_or_none()
    
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sample not found"
        )
    
    # Get project info
    project_name = sample.project.name if sample.project else "Unknown Project"
    project_code = sample.project.code if sample.project else "N/A"
    
    return SampleDetail(
        **sample.__dict__,
        project_name=project_name,
        project_code=project_code
    )


@router.patch("/{sample_id}", response_model=SampleResponse)
async def update_sample(
    sample_id: uuid.UUID,
    update_data: SampleUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update sample information
    
    - Update name, model, status, location, or notes
    - Status: in_stock, in_use, returned, scrapped
    """
    sample = await sample_service.get_sample(db, sample_id)
    
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sample not found"
        )
    
    updated_sample = await sample_service.update_sample(db, sample, update_data)
    return updated_sample


@router.delete("/{sample_id}", response_model=SampleResponse)
async def delete_sample(
    sample_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark sample as scrapped (soft delete)
    
    - Sets status to 'scrapped'
    - Does not actually delete data
    """
    sample = await sample_service.get_sample(db, sample_id)
    
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sample not found"
        )
    
    scrapped_sample = await sample_service.delete_sample(db, sample)
    return scrapped_sample


@router.post("/{sample_id}/regenerate-qr", response_model=QRCodeResponse)
async def regenerate_qr_code(
    sample_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Regenerate QR code for sample
    
    - Deletes old QR code from MinIO
    - Generates new QR code
    - Updates sample record
    """
    sample = await sample_service.get_sample(db, sample_id)
    
    if not sample:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sample not found"
        )
    
    updated_sample = await sample_service.regenerate_qr_code(db, sample)
    
    return QRCodeResponse(
        sample_id=updated_sample.id,
        sample_code=updated_sample.code,
        qr_code_url=updated_sample.qr_code_url,
        generated_at=datetime.utcnow()
    )
