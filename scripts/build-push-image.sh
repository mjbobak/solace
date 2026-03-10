#!/bin/bash

# Check if environment argument is provided
if [ -z "$1" ]; then
  echo "Error: Environment argument required"
  echo "Usage: $0 <environment>"
  echo "  environment: 'dev' or 'prod'"
  echo ""
  echo "Example:"
  echo "  $0 dev   # Deploy to development"
  echo "  $0 prod  # Deploy to production"
  exit 1
fi

ENVIRONMENT=$1

# Validate environment argument
if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "prod" ]; then
  echo "Error: Invalid environment '$ENVIRONMENT'"
  echo "Valid options are: 'dev' or 'prod'"
  exit 1
fi

echo "=== Deploying to $ENVIRONMENT environment ==="

# Set environment-specific variables
if [ "$ENVIRONMENT" = "dev" ]; then
  SUBSCRIPTION_ID="e9338875-2156-43fd-9292-d359060d5185"
  RESOURCE_GROUP='rg-lumos-dev-eastus2'
  CONTAINERAPP_NAME='ca-lumos-dev-eastus2'
  ACR_NAME='crlumosdeveastus2'
elif [ "$ENVIRONMENT" = "prod" ]; then
  SUBSCRIPTION_ID="df20e887-d8ca-4851-94c3-7d2e059d1353"
  RESOURCE_GROUP='rg-lumos-prd-eastus2'
  CONTAINERAPP_NAME='ca-lumos-prd-eastus2'
  ACR_NAME='crlumosprdeastus2'
fi

# Common variables
IMAGE_NAME='lumos'
VERSION_NUMBER=$(cat VERSION)
IMAGE_TAG="v${VERSION_NUMBER}-$(date +%Y%m%d%H%M)"
FULL_IMAGE_NAME="$ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG"

echo "=== Starting Docker build and push process ==="
echo "Full Image Name: $FULL_IMAGE_NAME"


# Login to Azure Container Registry
echo "=== Logging into Azure Container Registry: $ACR_NAME ==="
az account set --subscription $SUBSCRIPTION_ID
az acr login --name $ACR_NAME

# Build and push the image with multi-platform support
echo "=== Building and pushing the Docker image: $FULL_IMAGE_NAME ==="
docker buildx build \
  --platform linux/amd64 \
  --tag $FULL_IMAGE_NAME \
  --push \
  .

echo "=== Docker image built and pushed successfully ==="
az containerapp update \
  -g "$RESOURCE_GROUP" \
  -n "$CONTAINERAPP_NAME" \
  --image "$FULL_IMAGE_NAME"

echo "=== SUCCESS: Docker image built and pushed successfully to $FULL_IMAGE_NAME! ==="