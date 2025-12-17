# IoT Security Platform - Local Development with Poetry

## Prerequisites

- Python 3.10+
- Poetry 1.7+
- Docker & Docker Compose (for infrastructure only)

## Setup

1. **Install Poetry**:
   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   # or: brew install poetry
   ```

2. **Run setup script**:
   ```bash
   ./setup-local-dev.sh
   ```

   This will:
   - Create `.env` file for local development
   - Start infrastructure services (PostgreSQL, Redis, MinIO)
   - Install Poetry dependencies for all services

3. **Start services** (in separate terminals):

   ```bash
   # Terminal 1 - Auth Service
   cd services/auth
   poetry run uvicorn app.main:app --reload --port 8001

   # Terminal 2 - Core Service  
   cd services/core
   poetry run uvicorn app.main:app --reload --port 8002

   # Terminal 3 - Task Service
   cd services/task
   poetry run uvicorn app.main:app --reload --port 8003

   # Terminal 4 - File Service
   cd services/file
   poetry run uvicorn app.main:app --reload --port 8004
   ```

## Using Poetry Shell

Instead of `poetry run`, you can enter the virtual environment:

```bash
cd services/auth
poetry shell  # Activates venv

# Now you can run commands directly
uvicorn app.main:app --reload --port 8001
pytest
alembic upgrade head

# Exit shell
exit
```

## Development Workflow

### Adding Dependencies

```bash
cd services/auth
poetry add fastapi-limiter    # Production dependency
poetry add --group dev black  # Development dependency
```

### Running Tests

```bash
cd services/auth
poetry run pytest
# or in poetry shell: pytest
```

### Code Formatting

```bash
poetry run black app/
poetry run isort app/
```

## VS Code Integration

Add to `.vscode/settings.json`:

```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/services/auth/.venv/bin/python",
  "python.terminal.activateEnvironment": true,
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.formatting.provider": "black"
}
```

## Stopping Infrastructure

```bash
docker-compose down
# or keep data: docker-compose stop
```
