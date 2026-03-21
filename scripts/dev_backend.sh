#!/bin/sh

# Load environment variables for development
export DEV_MODE=true
export PYDANTIC_V1_FORCE_UPDATE_FORWARD_REFS=1

BACKEND_PORT=8000
DEFAULT_DB_PATH="data/database.db"
DEMO_DB_PATH="data/database.demo.db"

if [ -n "$1" ]; then
  DB_SELECTION="$1"
  case "$DB_SELECTION" in
    demo)
      export SOLACE_DB_PATH="$DEMO_DB_PATH"
      ;;
    default|live)
      export SOLACE_DB_PATH="$DEFAULT_DB_PATH"
      ;;
    *)
      export SOLACE_DB_PATH="$DB_SELECTION"
      ;;
  esac
elif [ -z "$SOLACE_DB_PATH" ]; then
  export SOLACE_DB_PATH="$DEFAULT_DB_PATH"
fi

if [ ! -f "$SOLACE_DB_PATH" ]; then
  echo "Database file not found: $SOLACE_DB_PATH"
  exit 1
fi

echo "Using database: $SOLACE_DB_PATH"

# Activate Python venv
source .venv/bin/activate

# Kill any process using the backend port
PIDS_BACKEND=$(lsof -ti tcp:$BACKEND_PORT)
if [ -n "$PIDS_BACKEND" ]; then
  echo "Killing process(es) on port $BACKEND_PORT (PID(s): $PIDS_BACKEND)"
  echo "$PIDS_BACKEND" | xargs kill -9
fi

uvicorn backend.app.main:app --reload --port $BACKEND_PORT --log-level debug
