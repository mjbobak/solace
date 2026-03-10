#!/bin/sh

# Load environment variables for development
export DEV_MODE=true
export PYDANTIC_V1_FORCE_UPDATE_FORWARD_REFS=1

BACKEND_PORT=8000

# Activate Python venv
source .venv/bin/activate

# Kill any process using the backend port
PIDS_BACKEND=$(lsof -ti tcp:$BACKEND_PORT)
if [ -n "$PIDS_BACKEND" ]; then
  echo "Killing process(es) on port $BACKEND_PORT (PID(s): $PIDS_BACKEND)"
  echo "$PIDS_BACKEND" | xargs kill -9
fi

uvicorn backend.app.main:app --reload --port $BACKEND_PORT --log-level debug