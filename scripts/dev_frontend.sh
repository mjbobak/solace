#!/bin/sh

FRONTEND_PORT=5173

# Kill any process using the frontend port
PIDS_FRONTEND=$(lsof -ti tcp:$FRONTEND_PORT)
if [ -n "$PIDS_FRONTEND" ]; then
  echo "Killing process(es) on port $FRONTEND_PORT (PID(s): $PIDS_FRONTEND)"
  echo "$PIDS_FRONTEND" | xargs kill -9
fi

# Install dependencies if node_modules does not exist
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

# Start the frontend dev server
npm run dev
