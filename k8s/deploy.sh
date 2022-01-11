#!/bin/bash
CURRENT_PATH="`dirname \"$0\"`"
ENVIRONMENT_PATH=$CURRENT_PATH/environments/$ENVIRONMENT

kubectl apply -f $ENVIRONMENT_PATH/sealedsecret.yaml
helm upgrade -f $ENVIRONMENT_PATH/values.yaml timecalendar $CURRENT_PATH/timecalendar -n $KUBE_NAMESPACE --render-subchart-notes

kubectl rollout restart -n $KUBE_NAMESPACE deployment timecalendar
