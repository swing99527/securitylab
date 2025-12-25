"""
Sample management service layer
"""
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Tuple
from datetime import datetime
import uuid

from app.models.models import Sample, Project
from app.schemas.samples import (
    SampleCreate,
    SampleUpdate,
    SampleQuery
)
from app.services.qr_code import qr_service


async def generate_sample_code(db: AsyncSession) -> str:
    """
    Generate unique sample code in format: SPL-YYYYMMDD-NNN
    Example: SPL-20251216-001, SPL-20251216-002, etc.
    """
    today = datetime.now().strftime('%Y%m%d')
    prefix = f"SPL-{today}-"
    
    # Get latest code for today
    stmt = select(Sample.code).where(
        Sample.code.like(f"{prefix}%")
    ).order_by(Sample.code.desc()).limit(1)
    
    result = await db.execute(stmt)
    latest_code = result.scalar_one_or_none()
    
    if latest_code:
        # Extract number and increment
        try:
            number = int(latest_code.split('-')[-1])
            new_number = number + 1
        except (ValueError, IndexError):
            new_number = 1
    else:
        new_number = 1
    
    # Format: SPL-20251216-001
    return f"{prefix}{new_number:03d}"


async def create_sample(
    db: AsyncSession,
    sample_data: SampleCreate
) -> Sample:
    """Create new sample with auto-generated code and QR code"""
    # ⭐ Phase 3: Validate project_id is provided
    if not sample_data.project_id:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400,
            detail="project_id is required. Samples must belong to a project."
        )
    
    # ⭐ Phase 3: Validate project exists
    project_stmt = select(Project).where(Project.id == sample_data.project_id)
    project_result = await db.execute(project_stmt)
    project = project_result.scalar_one_or_none()
    
    if not project:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail=f"Project {sample_data.project_id} not found"
        )
    
    # Generate unique code
    code = await generate_sample_code(db)
    
    # Generate QR code
    qr_code_url = qr_service.generate_qr_code(code)
    
    # Create sample
    sample = Sample(
        id=uuid.uuid4(),
        code=code,
        name=sample_data.name,
        model=sample_data.model,
        manufacturer=sample_data.manufacturer,
        project_id=sample_data.project_id,
        location=sample_data.location,
        notes=sample_data.notes,
        qr_code_url=qr_code_url,
        status="in_stock"
    )
    
    db.add(sample)
    await db.commit()
    await db.refresh(sample)
    
    return sample


async def get_sample(
    db: AsyncSession,
    sample_id: uuid.UUID
) -> Optional[Sample]:
    """Get sample by ID"""
    stmt = select(Sample).where(Sample.id == sample_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def list_samples(
    db: AsyncSession,
    query: SampleQuery
) -> Tuple[List[Sample], int]:
    """
    List samples with pagination and filters
    Returns: (samples, total_count)
    """
    # Build query
    stmt = select(Sample)
    count_stmt = select(func.count()).select_from(Sample)
    
    # Apply filters
    filters = []
    
    if query.status:
        filters.append(Sample.status == query.status)
    
    if query.project_id:
        filters.append(Sample.project_id == query.project_id)
    
    if query.search:
        search_pattern = f"%{query.search}%"
        filters.append(
            or_(
                Sample.name.ilike(search_pattern),
                Sample.model.ilike(search_pattern),
                Sample.manufacturer.ilike(search_pattern),
                Sample.code.ilike(search_pattern)
            )
        )
    
    if filters:
        stmt = stmt.where(and_(*filters))
        count_stmt = count_stmt.where(and_(*filters))
    
    # Get total count
    total_result = await db.execute(count_stmt)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (query.page - 1) * query.page_size
    stmt = stmt.offset(offset).limit(query.page_size)
    
    # Order by created_at desc
    stmt = stmt.order_by(Sample.created_at.desc())
    
    # Execute query
    result = await db.execute(stmt)
    samples = result.scalars().all()
    
    return list(samples), total


async def update_sample(
    db: AsyncSession,
    sample: Sample,
    update_data: SampleUpdate
) -> Sample:
    """Update sample fields"""
    update_dict = update_data.model_dump(exclude_unset=True)
    
    for field, value in update_dict.items():
        setattr(sample, field, value)
    
    sample.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(sample)
    
    return sample


async def delete_sample(
    db: AsyncSession,
    sample: Sample
) -> Sample:
    """Soft delete sample (set status to scrapped)"""
    sample.status = "scrapped"
    sample.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(sample)
    
    return sample


async def regenerate_qr_code(
    db: AsyncSession,
    sample: Sample
) -> Sample:
    """Regenerate QR code for sample"""
    # Delete old QR code if exists
    if sample.qr_code_url:
        try:
            qr_service.delete_qr_code(sample.qr_code_url)
        except Exception:
            pass  # Ignore deletion errors
    
    # Generate new QR code
    qr_code_url = qr_service.generate_qr_code(sample.code)
    
    # Update sample
    sample.qr_code_url = qr_code_url
    sample.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(sample)
    
    return sample
