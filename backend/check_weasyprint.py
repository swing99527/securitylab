
try:
    import weasyprint
    from weasyprint import HTML
    print("WeasyPrint imported successfully")
    print(f"Version: {weasyprint.__version__}")
    
    # Try a simple render
    try:
        html = HTML(string="<h1>Hello</h1>")
        doc = html.render()
        print("WeasyPrint rendering test passed")
    except Exception as e:
        print(f"WeasyPrint rendering failed: {e}")
        import sys
        sys.exit(1)

except ImportError:
    print("WeasyPrint not installed")
    import sys
    sys.exit(1)
except Exception as e:
    print(f"WeasyPrint check failed: {e}")
    import sys
    sys.exit(1)
