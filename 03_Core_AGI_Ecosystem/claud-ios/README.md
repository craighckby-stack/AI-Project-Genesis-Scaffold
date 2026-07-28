# ClaudIOS Bridge

Connects the SQLite memory backend to the React dashboard, providing real-time observability and control for the ClaudIOS ecosystem.

## Prerequisites

- Python 3.10+
- Node.js 18+ (pnpm recommended)
- Access to the ClaudIOS system database (`memory.db`)

## Architecture Overview

| Component | Responsibility |
|-----------|----------------|
| `api_server.py` | FastAPI backend providing RESTful access to SQLite |
| `constants.ts` | Shared configuration and type definitions |
| `App.tsx` | Main dashboard entry point with integrated state management |

## Installation & Setup

### 1. Backend (Python)

bash
pip install -r requirements.txt

# Run the API bridge
# Default path: /var/lib/claudiosos/memory.db
export CLAUDIOSOS_DB=./memory.db 
uvicorn api_server:app --reload


### 2. Frontend (React)

Ensure your React project is initialized. Move the bridge files into your `src/` directory:

bash
cp constants.ts App.tsx /path/to/claud-ios/src/
cd /path/to/claud-ios
pnpm install
pnpm dev


### 3. Configuration

Create a `.env` file in the frontend root to override the default API location:

env
VITE_API_URL=http://localhost:8000


## API Reference

Interactive documentation is available at `http://localhost:8000/docs` once the server is running.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/state` | GET | Full system snapshot (Metrics, Facts, Directives) |
| `/facts` | GET/POST | Manage system facts |
| `/directives` | GET/POST | Manage system directives |
| `/conversations` | GET | Retrieve conversation history |
| `/logs` | GET | Aggregated system logs |

## Troubleshooting

- **Database Locked:** Ensure the ClaudIOS daemon is not holding an exclusive write lock on `memory.db`.
- **CORS Errors:** If the frontend is on a different port, ensure `api_server.py` has the appropriate `CORSMiddleware` configuration.
- **Missing Data:** Verify that the `CLAUDIOSOS_DB` environment variable points to a valid file path with read permissions.

## Dashboard Features

- **State:** Live system metrics (CPU/RAM/VRAM) and active directives.
- **Chat:** Real-time conversation history visualization.
- **Logs:** Filterable log streams from kernel, init, and supervisor.
- **Source:** In-browser source code explorer.