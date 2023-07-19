#!/bin/bash
set -o xtrace
API_URL="${API_URL:-http://localhost:3005/api-json}"

while getopts t: flag
do
    case "${flag}" in
        t) TYPE=${OPTARG};;
    esac
done

if [ -z "$TYPE" ]; then
  COMPILE_DART="true"
  COMPILE_JS="true"
elif [ "$TYPE" = "dart" ]; then
  COMPILE_DART="true"
elif [ "$TYPE" = "js" ]; then
  COMPILE_JS="true"
fi

# Dart
if [ "$COMPILE_DART" = true ]; then
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
  dart format dart
fi


# JavaScript
if [ "$COMPILE_JS" = true ]; then
  ./scripts/openapi-generator-cli.sh generate \
    -i $API_URL \
    -g typescript-axios \
    -o ./javascript/src/
  cd javascript
  npm run build
  cd $OLDPWD
fi
