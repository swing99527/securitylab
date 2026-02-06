"""
Pydantic schemas for reports
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class ReportBase(BaseModel):
    """Base schema for reports"""
    title: str = Field(..., min_length=1, max_length=200)
    project_id: UUID
    version: Optional[str] = "v1.0"
    content: Optional[dict] = None
    
    # Client and Testing Organization
    client_company: Optional[str] = None
    client_contact: Optional[str] = None
    client_address: Optional[str] = None
    testing_organization: Optional[str] = None
    
    # Test Object Information
    product_name: Optional[str] = None
    product_model: Optional[str] = None
    manufacturer: Optional[str] = None
    manufacturer_address: Optional[str] = None
    sample_info: Optional[dict] = None
    
    # Test Standards & Scope
    test_standards: Optional[list] = None
    test_scope: Optional[str] = None
    test_methodology: Optional[str] = None
    test_limitations: Optional[str] = None
    test_period_start: Optional[datetime] = None
    test_period_end: Optional[datetime] = None
    
    # Conclusion
    security_rating: Optional[str] = None
    compliance_status: Optional[str] = None
    certification_recommendation: Optional[str] = None
    conclusion: Optional[str] = None

class ReportCreate(ReportBase):
    """Schema for creating a report"""
    pass

class ReportUpdate(BaseModel):
    """Schema for updating a report"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    version: Optional[str] = None
    status: Optional[str] = None
    content: Optional[dict] = None
    reviewer_id: Optional[UUID] = None
    
    # Client and Testing Organization
    client_company: Optional[str] = None
    client_contact: Optional[str] = None
    client_address: Optional[str] = None
    testing_organization: Optional[str] = None
    
    # Test Object Information
    product_name: Optional[str] = None
    product_model: Optional[str] = None
    manufacturer: Optional[str] = None
    manufacturer_address: Optional[str] = None
    sample_info: Optional[dict] = None
    
    # Test Standards & Scope
    test_standards: Optional[list] = None
    test_scope: Optional[str] = None
    test_methodology: Optional[str] = None
    test_limitations: Optional[str] = None
    test_period_start: Optional[datetime] = None
    test_period_end: Optional[datetime] = None
    
    # Conclusion
    security_rating: Optional[str] = None
    compliance_status: Optional[str] = None
    certification_recommendation: Optional[str] = None
    conclusion: Optional[str] = None
    
    # Signature tracking
    tester_id: Optional[UUID] = None
    approver_id: Optional[UUID] = None

class ReportResponse(ReportBase):
    """Schema for report response"""
    id: UUID
    code: str
    status: str
    author_id: UUID
    author_name: Optional[str] = None
    reviewer_id: Optional[UUID] = None
    reviewer_name: Optional[str] = None
    tester_id: Optional[UUID] = None
    tester_name: Optional[str] = None
    approver_id: Optional[UUID] = None
    approver_name: Optional[str] = None
    project_name: Optional[str] = None
    project_code: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ReportListParams(BaseModel):
    """Schema for report list query parameters"""
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
    status: Optional[str] = None
    project_id: Optional[UUID] = None
    search: Optional[str] = None

class ReportDetail(ReportResponse):
    """Schema for detailed report response"""
    # Can include additional fields like related tasks, vulnerabilities, etc
    pass
