#!/bin/bash
API_URL="${API_URL:-http://localhost:3005/api-json}"
rm -r ./dart
JAVA_OPTS='-DapiTests=false -DmodelTests=false -DapiDocs=false' ./scripts/openapi-generator-cli.sh generate \
  -i $API_URL \
  -g dart-dio \
  -o ./dart/ \
  -c ./dart.yaml \
  --enable-post-process-file
cd dart
flutter pub get
flutter pub run build_runner build
cd ..
cd scripts
npm install
npm run dart
cd $OLDPWD
