"""
Helper functions for generating new report sections (test object, standards, methodology, conclusion)
To be inserted into reports.py after _aggregate_vulnerabilities function
"""

def _generate_test_object_section(report: 'Report') -> str:
    """
    Generate test object information section
    Returns: HTML content for test object section
    """
    if not any([report.product_name, report.manufacturer, report.sample_info]):
        return ""
    
    html = "<h3>2. 测试对象信息</h3>"
    
    # Product Information
    if report.product_name or report.product_model:
        html +="<h4>2.1 产品信息</h4>"
        html += "<table border='1' cellspacing='0' cellpadding='5' style='width:100%; border-collapse: collapse;'>"
        
        if report.product_name:
            html += f"<tr><td style='width:30%; background-color:#f2f2f2;'><strong>产品名称</strong></td><td>{report.product_name}</td></tr>"
        if report.product_model:
            html += f"<tr><td style='background-color:#f2f2f2;'><strong>产品型号</strong></td><td>{report.product_model}</td></tr>"
        if report.manufacturer:
            html += f"<tr><td style='background-color:#f2f2f2;'><strong>制造商</strong></td><td>{report.manufacturer}</td></tr>"
        if report.manufacturer_address:
            html += f"<tr><td style='background-color:#f2f2f2;'><strong>制造商地址</strong></td><td>{report.manufacturer_address}</td></tr>"
        
        html += "</table><br/>"
    
    # Sample Information
    if report.sample_info:
        html += "<h4>2.2 样品信息</h4>"
        html += "<table border='1' cellspacing='0' cellpadding='5' style='width:100%; border-collapse: collapse;'>"
        
        sample = report.sample_info
        if sample.get('serial_number'):
            html += f"<tr><td style='width:30%; background-color:#f2f2f2;'><strong>序列号</strong></td><td>{sample['serial_number']}</td></tr>"
        if sample.get('firmware_version'):
            html += f"<tr><td style='background-color:#f2f2f2;'><strong>固件版本</strong></td><td>{sample['firmware_version']}</td></tr>"
        if sample.get('hardware_version'):
            html += f"<tr><td style='background-color:#f2f2f2;'><strong>硬件版本</strong></td><td>{sample['hardware_version']}</td></tr>"
        if sample.get('quantity'):
            html += f"<tr><td style='background-color:#f2f2f2;'><strong>样品数量</strong></td><td>{sample['quantity']}</td></tr>"
        if sample.get('reception_date'):
            html += f"<tr><td style='background-color:#f2f2f2;'><strong>接收日期</strong></td><td>{sample['reception_date']}</td></tr>"
        if sample.get('condition'):
            html += f"<tr><td style='background-color:#f2f2f2;'><strong>样品状态</strong></td><td>{sample['condition']}</td></tr>"
        
        html += "</table>"
    
    return html


def _generate_standards_and_scope_section(report: 'Report') -> str:
    """
    Generate test standards and scope section
    Returns: HTML content for standards and scope
    """
    if not any([report.test_standards, report.test_scope, report.test_methodology]):
        return ""
    
    html = "<h3>3. 测试依据与范围</h3>"
    
    # Test Standards
    if report.test_standards:
        html += "<h4>3.1 测试标准</h4>"
        html += "<ul>"
        for std in report.test_standards:
            standard_code = std.get('standard', 'N/A')
            standard_title = std.get('title', '')
            html += f"<li><strong>{standard_code}</strong>: {standard_title}</li>"
        html += "</ul>"
    
    # Test Scope
    if report.test_scope:
        html += "<h4>3.2 测试范围</h4>"
        html += f"<p>{report.test_scope}</p>"
    
    # Test Methodology
    if report.test_methodology:
        html += "<h4>3.3 测试方法</h4>"
        html += f"<p>{report.test_methodology}</p>"
    
    # Test Limitations
    if report.test_limitations:
        html += "<h4>3.4 测试限制</h4>"
        html += f"<p>{report.test_limitations}</p>"
    
    # Test Period
    if report.test_period_start or report.test_period_end:
        html += "<h4>3.5 测试周期</h4>"
        html += "<p>"
        if report.test_period_start:
            html += f"<strong>开始时间:</strong> {report.test_period_start.strftime('%Y-%m-%d %H:%M:%S')}<br/>"
        if report.test_period_end:
            html += f"<strong>结束时间:</strong> {report.test_period_end.strftime('%Y-%m-%d %H:%M:%S')}"
        html += "</p>"
    
    return html


def _generate_conclusion_section(report: 'Report', total_critical: int, total_high: int) -> str:
    """
    Generate formal conclusion section
    Returns: HTML content for conclusion
    """
    html = "<h3>测试结论</h3>"
    
    # Security Rating
    if report.security_rating:
        rating_map = {
            'excellent': ('优秀', 'green'),
            'good': ('良好', '#4caf50'),
            'fair': ('中等', 'orange'),
            'poor': ('较差', 'red')
        }
        rating_text, rating_color = rating_map.get(report.security_rating, ('未评级', 'gray'))
        
        html += f"<h4>安全评级</h4>"
        html += f"<p>基于本次测试结果，产品整体安全评级为: <strong style='color:{rating_color}; font-size:1.2em;'>{rating_text}</strong></p>"
    
    # Compliance Status
    if report.compliance_status:
        status_map = {
            'pass': ('通过', 'green', '该产品满足所有测试标准要求。'),
            'conditional_pass': ('有条件通过', 'orange', '该产品基本满足测试标准要求，但存在需要改进的问题。'),
            'fail': ('不通过', 'red', '该产品未能满足测试标准要求。')
        }
        status_text, status_color, status_desc = status_map.get(report.compliance_status, ('未确定', 'gray', ''))
        
        html += f"<h4>合规状态</h4>"
        html += f"<p><strong style='color:{status_color}; font-size:1.2em;'>{status_text}</strong></p>"
        html += f"<p>{status_desc}</p>"
    
    # Summary based on findings
    html += "<h4>测试总结</h4>"
    if total_critical > 0:
        html += f"<p style='color:red;'><strong>警告:</strong> 发现 {total_critical} 个严重漏洞，需要立即处理。</p>"
    elif total_high > 0:
        html += f"<p style='color:orange;'><strong>提示:</strong> 发现 {total_high} 个高危漏洞，建议优先修复。</p>"
    else:
        html += "<p style='color:green;'>本次测试未发现严重或高危安全漏洞。</p>"
    
    # Custom Conclusion
    if report.conclusion:
        html += f"<p>{report.conclusion}</p>"
    
    # Certification Recommendation
    if report.certification_recommendation:
        html += "<h4>认证建议</h4>"
        html += f"<p>{report.certification_recommendation}</p>"
    
    return html
