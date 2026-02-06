
import weasyprint
from weasyprint import HTML, CSS

print(f"WeasyPrint Version: {weasyprint.__version__}")

css_content = """
    @page {
        size: A4;
        margin: 2.5cm 2cm 3cm 2cm;
        
        @bottom-center {
            content: counter(page);
            font-size: 10pt;
            color: #666;
        }
    }
    
    body {
        font-family: "DejaVu Sans", "Liberation Sans", Arial, sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #333;
    }
    
    /* Cover Page */
    .cover-page {
        page-break-after: always;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
    }
    
    .cover-content {
        width: 100%;
    }
    
    .report-title {
        font-size: 28pt;
        font-weight: bold;
        color: #1a1a1a;
        margin-bottom: 2cm;
    }
    
    .report-meta {
        font-size: 12pt;
        line-height: 2;
        margin-bottom: 3cm;
    }
    
    .report-meta p {
        margin: 0.5cm 0;
    }
    
    .logo {
        margin-top: 4cm;
        font-size: 18pt;
        color: #2196F3;
    }
    
    .logo p {
        font-size: 12pt;
        color: #666;
        margin-top: 0.5cm;
    }
    
    /* Content Styling */
    .section {
        margin-bottom: 1.5cm;
        page-break-inside: avoid;
    }
    
    .section-title {
        font-size: 16pt;
        font-weight: bold;
        color: #2196F3;
        border-bottom: 2pt solid #2196F3;
        padding-bottom: 0.3cm;
        margin-top: 1cm;
        margin-bottom: 0.8cm;
    }
"""

html_content = """
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <title>Test Report</title>
    </head>
    <body>
        <!-- Cover Page -->
        <div class="cover-page">
            <div class="cover-content">
                <h1 class="report-title">Test Report Title</h1>
                <div class="report-meta">
                    <p><strong>报告编号:</strong> TEST-001</p>
                    <p><strong>项目名称:</strong> Test Project</p>
                    <p><strong>生成日期:</strong> 2024-02-05</p>
                </div>
                <div class="logo">
                    <h2>SecurityLab</h2>
                    <p>IoT Security Testing Platform</p>
                </div>
            </div>
        </div>
        
        <!-- Page Break -->
        <div class="page-break"></div>
        
        <!-- Report Content -->
        <div class="report-content">
            <div class="section">
                <h2 class="section-title">测试结论</h2>
                <div class="section-content">
                    <p>这是一个测试段落。</p>
                </div>
            </div>
        </div>
    </body>
    </html>
"""

try:
    print("Generating PDF...")
    html = HTML(string=html_content)
    css = CSS(string=css_content)
    doc = html.render(stylesheets=[css])
    doc.write_pdf("test_report.pdf")
    print("PDF generated successfully: test_report.pdf")
except Exception as e:
    print(f"PDF generation failed: {e}")
    import traceback
    traceback.print_exc()
    import sys
    sys.exit(1)
