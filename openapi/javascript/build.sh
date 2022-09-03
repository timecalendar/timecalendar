#!/bin/bash
COMMAND="gsed"
if ! command -v gsed &> /dev/null
then
  COMMAND="sed"
fi
$COMMAND -i -r 's/[a-zA-Z]+Controller([A-Z])/\l\1/' src/api.ts
npm install
npm run tsc
