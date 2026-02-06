
# Report System Logic and Functional Design

## 1. Overview
The Report System is a critical component of the IoT Security Testing Platform. It aggregates data from various security testing tasks (Firmware Analysis, Network Scanning, Vulnerability Scanning) into a unified, professional security report.

## 2. Current Architecture
Currently, the report generation logic is implemented in `backend/app/services/reports.py`.
- **Trigger**: User requests "Create Report" via Frontend (`CreateReportDialog`).
- **Input**: Project ID.
- **Data Fetching**: Queries `Task` table for completed tasks associated with the project.
- **Processing**:
  - Currently primarily supports **Firmware Analysis** results stored in `Task.results`.
  - Generates HTML content segments for defined sections (Executive Summary, Findings).
- **Output**: Stores structured content (sections list) in `Report.content` (JSONB).
- **Display**: Frontend `ReportEditor` renders the content.

## 3. Data Source Limitations (The Gap)
The current implementation fails to aggregate data from complex scan types that store results in separate tables:

| Task Type | Data Location | Current Support |
|-----------|---------------|-----------------|
| **Firmware Analysis** | `Task.results['findings']` | ✅ Fully Supported |
| **Nmap Scan** | `ScanResult` table | ❌ Missing |
| **Vulnerability Scan** | `Vulnerability` table | ❌ Missing |
| **Fuzzing** | `Task.results` (Likely) | ❌ Missing |

## 4. Proposed Functional Design

### 4.1 Modular Data Aggregation
The `generate_project_report_content` function should be refactored into a modular `ReportAggregator` class or set of functions to handle different data sources independently.

#### 4.1.1 Network Security Section (Nmap)
- **Source**: Query `ScanResult` table where `task.project_id == project_id`.
- **Content**:
  - List of discovered hosts (IP, Hostname).
  - Open Ports & Services table.
  - Network Topology visualization (optional, SVG/Image).

#### 4.1.2 Vulnerability Analysis Section (VulnScan)
- **Source**: Query `Vulnerability` table where `task.project_id == project_id`.
- **Content**:
  - Summary by Severity (Critical, High, Medium, Low).
  - Detailed CVE Table:
    - CVE ID, CVSS Score, Severity.
    - Affected Service/Port.
    - Description & Remediation (from NVD data).

### 4.2 Report Structure Standardization
The report content JSON structure is standardized as:
```json
{
  "sections": [
    {
      "id": "summary",
      "title": "Executive Summary",
      "content": "HTML Block"
    },
    {
      "id": "network_security",
      "title": "Network Security",
      "content": "HTML Block"
    },
    {
      "id": "app_security",
      "title": "Application Security (Firmware)",
      "content": "HTML Block"
    }
  ]
}
```

### 4.3 PDF Export Capability
- **Requirement**: Users need downloadable PDF reports.
- **Implementation Plan**:
  - **Engine**: `WeasyPrint` (Python library) is recommended for converting HTML to PDF with good CSS support.
  - **Endpoint**: `GET /api/v1/reports/{id}/export/pdf`.
  - **Process**:
    1. Fetch `Report` entity.
    2. Assemble a single HTML document from `Report.content.sections`.
    3. Apply a print-friendly CSS template (Header, Footer, Page numbers).
    4. Generate PDF bytes and return as `application/pdf`.

## 5. Implementation Roadmap

### Phase 1: Data Aggregation Expansion (Immediate)
1.  **Refactor `reports.py`**: Create `ReportGenerator` class.
2.  **Add `_include_nmap_results`**: Fetch and format `ScanResult` data.
3.  **Add `_include_vuln_results`**: Fetch and format `Vulnerability` data.
4.  **Update `generate_project_report_content`**: Call these new modules to build a comprehensive report.

### Phase 2: PDF Export
1.  Add `weasyprint` to dependencies.
2.  Create HTML/CSS template for PDF.
3.  Implement `export_report_pdf` service function.
4.  Expose API endpoint.

### Phase 3: Frontend Upload Fix
1.  Update `firmware-config.tsx` to use environment variables for API URL.
2.  Verify full end-to-end flow.
