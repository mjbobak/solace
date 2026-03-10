#!/bin/sh
set -e

# Export FastAPI-specific vars (if needed)
export PYDANTIC_V1_FORCE_UPDATE_FORWARD_REFS=1

# Start both NGINX and FastAPI with supervisor
exec supervisord -c /etc/supervisord.conf
