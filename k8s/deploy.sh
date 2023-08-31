#!/bin/bash

if [ -z "$ENVIRONMENT" ]; then
  if [ ! -z "$GITHUB_REF" ]; then
    if [[ $GITHUB_REF == 'refs/heads/main' ]] || [[ $GITHUB_REF == 'refs/heads/github-cd' ]]; then
      ENVIRONMENT="preprod"
    elif [[ $GITHUB_REF == 'refs/heads/production' ]]; then
      ENVIRONMENT="production"
    else
      printf '%s\n' "Cannot deploy from the branch $GITHUB_REF" >&2
      exit 1
    fi
  else
    printf '%s\n' "Missing ENVIRONMENT variable" >&2
    exit 1
  fi
fi

if [ -z "$DOCKER_TAG" ]; then
  printf '%s\n' "Missing DOCKER_TAG variable" >&2
  exit 1
fi

KUBE_NAMESPACE="timecalendar-$ENVIRONMENT"

echo Environment to deploy: $ENVIRONMENT
echo Docker tag to deploy: $DOCKER_TAG
echo "-----------------------------------"
echo Namespace: $KUBE_NAMESPACE

CURRENT_PATH="`dirname \"$0\"`"
ENVIRONMENT_PATH=$CURRENT_PATH/environments/$ENVIRONMENT

kubectl apply -f $ENVIRONMENT_PATH/sealedsecret.yaml
helm upgrade -f $ENVIRONMENT_PATH/values.yaml \
  -f $ENVIRONMENT_PATH/secret-values.yaml \
  --set server.tag=$DOCKER_TAG \
  --set web.tag=$DOCKER_TAG \
  timecalendar $CURRENT_PATH/timecalendar -n $KUBE_NAMESPACE --render-subchart-notes || exit 1

kubectl rollout restart -n $KUBE_NAMESPACE deployment timecalendar
kubectl rollout status -n $KUBE_NAMESPACE deployment timecalendar

kubectl rollout restart -n $KUBE_NAMESPACE deployment timecalendar-web
kubectl rollout status -n $KUBE_NAMESPACE deployment timecalendar-web
