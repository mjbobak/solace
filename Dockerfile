# === STAGE 1: Build Frontend ===
FROM node:22.13.0 AS builder

WORKDIR /app/frontend

# Copy dependency files first for better caching
COPY package.json package-lock.json ./

# Install dependencies with cache mount
RUN --mount=type=secret,id=NPMRC_FILE,dst=.npmrc \
    --mount=type=cache,target=/root/.npm \
    npm ci

# Copy build configuration
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./

# Copy environment config
COPY .env.docker .env

# Copy source files (changes here won't invalidate npm install)
COPY public public/
COPY src src/

# Build frontend
RUN npm run build

# === STAGE 2: Build Python Dependencies ===
FROM python:3.12-slim AS python-builder

# Install build dependencies
# hadolint ignore=DL3008
RUN apt-get update \
    && apt-get -y install --no-install-recommends \
        build-essential \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only requirements first for better caching
COPY requirements.txt .

# Install Python dependencies + supervisor in a virtual environment
RUN --mount=type=cache,target=/root/.cache/pip \
    python -m venv /opt/venv \
    && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt \
    && /opt/venv/bin/pip install --no-cache-dir 'supervisor==4.3.0'

# Copy backend
COPY backend ./backend

# Compile backend Python bytecode
RUN /opt/venv/bin/python -m compileall -b backend/ \
    && find backend/ -type f -name '*.py' -delete \
    && find backend/ -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true

# Compile venv Python bytecode and remove unnecessary files
RUN /opt/venv/bin/python -m compileall -b /opt/venv \
    && find /opt/venv -type f -name '*.py' -delete \
    && find /opt/venv -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true \
    && find /opt/venv -type d -name 'tests' -exec rm -rf {} + 2>/dev/null || true \
    && find /opt/venv -type d -name '*.dist-info' -exec rm -rf {}/RECORD {} + 2>/dev/null || true

# === STAGE 3: Final App with Frontend + Backend ===
FROM python:3.12-slim AS final

# Install only runtime dependencies (no build-essential)
# hadolint ignore=DL3008
RUN apt-get update \
    && apt-get -y upgrade --no-install-recommends \
    && apt-get -y install --no-install-recommends \
        ca-certificates \
        curl \
        gettext \
        nginx \
    && rm -rf /var/lib/apt/lists/*

# Create directories
WORKDIR /app

# Copy Python virtual environment from builder stage (includes supervisor)
COPY --from=python-builder /opt/venv /opt/venv

# Copy compiled backend bytecode from builder stage
COPY --from=python-builder /app/backend ./backend

# Copy requirements for reference only
COPY requirements.txt .

# Set PATH to use virtual environment
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Copy frontend from previous stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# NGINX config
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf

# Entrypoint
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh \
    && adduser --disabled-password --uid 1001 svp_user \
    && chown -R svp_user /usr/share/nginx/html /etc/nginx /var/log/nginx \
    && mkdir -p /var/lib/nginx \
    && chown -R svp_user /var/lib/nginx \
    && chown -R svp_user /etc/nginx/conf.d/ \
    && chmod -R 755 /var/lib/nginx \
    && mkdir -p /app/data \
    && chown -R svp_user /app/data

# Supervisor config
COPY supervisord.conf /etc/supervisord.conf

USER svp_user

# NGINX
EXPOSE 8080
# FastAPI
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
