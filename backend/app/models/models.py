"""
Database models for IoT Security Testing Platform
"""
from sqlalchemy import Column, String, Integer, DateTime, Date, ForeignKey, Text, Numeric, CheckConstraint, Index, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base

class User(Base):
    """User model"""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(String(20), nullable=False, server_default="engineer")
    department = Column(String(100))
    avatar = Column(String(500))
    status = Column(String(20), nullable=False, server_default="active")
    last_login_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        CheckConstraint(
            "role IN ('admin', 'director', 'manager', 'engineer', 'reviewer', 'signer', 'sample_admin', 'client')",
            name="chk_user_role"
        ),
        CheckConstraint(
            "status IN ('active', 'inactive', 'locked')",
            name="chk_user_status"
        ),
        Index("idx_users_role", "role"),
    )

class Project(Base):
    """Project model"""
    __tablename__ = "projects"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    client = Column(String(200), nullable=False)
    standard = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False, server_default="pending")
    progress = Column(Integer, server_default="0")
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    deadline = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    manager = relationship("User", foreign_keys=[manager_id])
    samples = relationship("Sample", back_populates="project")
    tasks = relationship("Task", back_populates="project")
    reports = relationship("Report", back_populates="project")
    
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'in_progress', 'review', 'completed', 'archived')",
            name="chk_project_status"
        ),
    )

class Sample(Base):
    """Sample model"""
    __tablename__ = "samples"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    model = Column(String(100))
    manufacturer = Column(String(200))
    status = Column(String(20), nullable=False, server_default="in_stock")
    location = Column(String(100))  # Made nullable
    qr_code_url = Column(String(500))
    notes = Column(Text)  # Added notes field
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="samples")
    
    __table_args__ = (
        CheckConstraint(
            "status IN ('in_stock', 'in_use', 'returned', 'scrapped')",
            name="chk_sample_status"
        ),
    )

class Task(Base):
    """Task model"""
    __tablename__ = "tasks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    sample_id = Column(UUID(as_uuid=True), ForeignKey("samples.id", ondelete="SET NULL"))
    type = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False, server_default="queued")
    priority = Column(String(20), server_default="medium")
    progress = Column(Integer, server_default="0")
    config = Column(JSONB)
    results = Column(JSONB)  # Task execution results (e.g., firmware analysis findings)
    notes = Column(Text)
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    celery_task_id = Column(String(255))
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="tasks")
    sample = relationship("Sample", backref="tasks")
    assignee = relationship("User", foreign_keys=[assignee_id])
    scan_results = relationship("ScanResult", back_populates="task", cascade="all, delete-orphan")
    vulnerabilities = relationship("Vulnerability", back_populates="task", cascade="all, delete-orphan")
    
    __table_args__ = (
        CheckConstraint(
            "status IN ('queued', 'running', 'paused', 'completed', 'failed', 'cancelled')",
            name="chk_task_status"
        ),
        CheckConstraint(
            "type IN ('ping_scan', 'nmap_scan', 'vuln_scan', 'firmware_analysis', 'fuzzing', 'pentest')",
            name="chk_task_type"
        ),
        CheckConstraint(
            "priority IN ('low', 'medium', 'high', 'urgent')",
            name="chk_task_priority"
        ),
        Index("idx_tasks_project", "project_id"),
        Index("idx_tasks_status", "status"),
        Index("idx_tasks_sample", "sample_id"),
    )

class ScanResult(Base):
    """Scan result model"""
    __tablename__ = "scan_results"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    scan_type = Column(String(50), nullable=False)
    target = Column(String(255))
    result = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    task = relationship("Task", back_populates="scan_results")
    vulnerabilities = relationship("Vulnerability", back_populates="scan_result", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index("idx_scan_result_task", "task_id"),
        Index("idx_scan_result_jsonb", "result", postgresql_using="gin"),
    )

class Vulnerability(Base):
    """Vulnerability model - Enhanced for CVE tracking"""
    __tablename__ = "vulnerabilities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    scan_result_id = Column(UUID(as_uuid=True), ForeignKey("scan_results.id", ondelete="CASCADE"))
    
    # Legacy fields (keep for backwards compatibility)
    name = Column(String(300))
    cve = Column(String(50))
    description = Column(Text)
    evidence = Column(JSONB)
    
    # CVE Information
    cve_id = Column(String(50), index=True)  # CVE-2024-1234
    cve_description = Column(Text)
    
    # Affected Service
    service_name = Column(String(100))
    service_version = Column(String(100))
    port = Column(Integer)
    protocol = Column(String(10))
    
    # Severity
    severity = Column(String(20), nullable=False)
    status = Column(String(20), server_default="open")
    cvss_score = Column(Float)  # Support 0.0-10.0
    cvss_vector = Column(String(200))
    
    # CVE Metadata
    published_date = Column(DateTime(timezone=True))
    last_modified_date = Column(DateTime(timezone=True))
    references = Column(JSONB)  # Array of {url, source}
    
    # Remediation
    remediation = Column(Text)
    
    # Timestamps
    discovered_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    task = relationship("Task", back_populates="vulnerabilities")
    scan_result = relationship("ScanResult", back_populates="vulnerabilities")
    
    __table_args__ = (
        CheckConstraint(
            "severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE', 'UNKNOWN', 'critical', 'high', 'medium', 'low', 'info')",
            name="chk_vuln_severity"
        ),
        Index("idx_vuln_task", "task_id"),
        Index("idx_vuln_scan_result", "scan_result_id"),
        Index("idx_vuln_cve_id", "cve_id"),
    )

class AuditLog(Base):
    """Audit log model"""
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50))
    resource_id = Column(UUID(as_uuid=True))
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    details = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")
    
    __table_args__ = (
        Index("idx_audit_user", "user_id"),
        Index("idx_audit_created", "created_at"),
    )

class Report(Base):
    """Report model"""
    __tablename__ = "reports"
    
    # Basic Information
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False)
    title = Column(String(200), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    version = Column(String(20), server_default="v1.0")
    status = Column(String(20), nullable=False, server_default="draft")
    content = Column(JSONB)  # Structured report content
    
    # Client and Testing Organization
    client_company = Column(String(200))  # 委托单位
    client_contact = Column(String(100))  # 联系人
    client_address = Column(String(300))  # 地址
    testing_organization = Column(String(200))  # 检测机构
    
    # Test Object Information
    product_name = Column(String(200))  # 产品名称
    product_model = Column(String(100))  # 型号
    manufacturer = Column(String(200))  # 制造商
    manufacturer_address = Column(String(300))  # 制造商地址
    sample_info = Column(JSONB)  # 样品信息详情 {serial_number, firmware_version, hardware_version, quantity, reception_date, condition}
    
    # Test Standards & Scope
    test_standards = Column(JSONB)  # 测试标准列表 [{standard: "GB/T xxxxx", title: "..."}]
    test_scope = Column(Text)  # 测试范围描述
    test_methodology = Column(Text)  # 测试方法描述
    test_limitations = Column(Text)  # 测试限制说明
    test_period_start = Column(DateTime(timezone=True))  # 测试开始时间
    test_period_end = Column(DateTime(timezone=True))  # 测试结束时间
    
    # Conclusion
    security_rating = Column(String(20))  # Overall: excellent/good/fair/poor
    compliance_status = Column(String(50))  # pass/fail/conditional_pass
    certification_recommendation = Column(Text)  # 认证建议
    conclusion = Column(Text)  # 测试结论
    
    # User Relationships
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))  # 报告编写人
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))  # 审核人
    tester_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))  # 测试工程师
    approver_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))  # 批准人
    approved_at = Column(DateTime(timezone=True))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="reports")
    author = relationship("User", foreign_keys=[author_id])
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    tester = relationship("User", foreign_keys=[tester_id])
    approver = relationship("User", foreign_keys=[approver_id])
    
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'pending_review', 'approved', 'rejected', 'signed')",
            name="chk_report_status"
        ),
        CheckConstraint(
            "security_rating IN ('excellent', 'good', 'fair', 'poor') OR security_rating IS NULL",
            name="chk_report_security_rating"
        ),
        CheckConstraint(
            "compliance_status IN ('pass', 'fail', 'conditional_pass') OR compliance_status IS NULL",
            name="chk_report_compliance_status"
        ),
        Index("idx_reports_project", "project_id"),
        Index("idx_reports_status", "status"),
        Index("idx_reports_code", "code"),
        Index("idx_reports_compliance", "compliance_status"),
    )
