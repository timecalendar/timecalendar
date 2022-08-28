#!/bin/bash
API_URL="${API_URL:-http://localhost:3005/api-json}"

# Dart
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
cd ..
flutter format dart

# JavaScript
./scripts/openapi-generator-cli.sh generate \
  -i $API_URL \
  -g typescript-axios \
  -o ./javascript/src/
cd javascript
COMMAND="gsed"
if ! command -v gsed &> /dev/null
then
  COMMAND="sed"
fi
$COMMAND -i -r 's/[a-zA-Z]+Controller([A-Z])/\l\1/' src/api.ts
npm run build
cd $OLDPWD
