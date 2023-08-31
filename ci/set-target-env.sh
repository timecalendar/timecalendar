#!/bin/bash

if [[ $GITHUB_REF == 'refs/heads/production' ]]; then
  TARGET_ENVIRONMENT=production
  DOCKER_TAG=production
elif [[ $GITHUB_REF == 'refs/heads/main' ]]; then
  TARGET_ENVIRONMENT=preprod
  DOCKER_TAG=latest
else
  TARGET_ENVIRONMENT=test
  DOCKER_TAG=test
fi

echo "TARGET_ENVIRONMENT=$TARGET_ENVIRONMENT" >> "$GITHUB_ENV"
echo "DOCKER_TAG=$DOCKER_TAG" >> "$GITHUB_ENV"
echo "K8S_KUBECONFIG_ENV=K8S_KUBECONFIG_${TARGET_ENVIRONMENT^^}" >> "$GITHUB_ENV"
echo "K8S_HELM_VALUES_ENV=K8S_HELM_VALUES_${TARGET_ENVIRONMENT^^}" >> "$GITHUB_ENV"

# Web environment variables
MAIN_API_URL=$(yq '.apiUrl' k8s/environments/$TARGET_ENVIRONMENT/values.yaml)
echo "MAIN_API_URL=$API_URL" > "web/.env"
