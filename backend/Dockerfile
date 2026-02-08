# Production Dockerfile for IoT Security Platform Backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for app and PDF generation
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    iputils-ping \
    # Security scanning tools
    nmap \
    binwalk \
    # Binwalk dependencies for firmware extraction
    mtd-utils \
    gzip \
    bzip2 \
    tar \
    arj \
    lhasa \
    p7zip \
    p7zip-full \
    cabextract \
    cramfsswap \
    squashfs-tools \
    zlib1g-dev \
    liblzma-dev \
    liblzo2-dev \
    # WeasyPrint dependencies for PDF export
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    # Fonts for better PDF rendering
    fonts-liberation \
    fonts-dejavu-core \
    # Chinese fonts for CJK support
    fonts-noto-cjk \
    fonts-wqy-zenhei \
    fonts-wqy-microhei \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN pip install --no-cache-dir poetry==2.0.1

# Copy dependency files
COPY pyproject.toml poetry.lock ./

# Install dependencies
RUN poetry config virtualenvs.create false \
    && poetry install --only main --no-interaction --no-ansi

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
