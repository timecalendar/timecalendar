#!/bin/bash
CURRENT_PATH="`dirname \"$0\"`"
ENVIRONMENT_PATH=$CURRENT_PATH/environments/$ENVIRONMENT

kubeseal < $ENVIRONMENT_PATH/secret.yaml > $ENVIRONMENT_PATH/sealedsecret.yaml
