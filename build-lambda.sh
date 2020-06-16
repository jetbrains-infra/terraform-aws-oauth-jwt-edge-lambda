#!/bin/bash

cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
set -e -x -u

## this script should be used to create a release package as we include
## binaries in this repo to simplify the process

rm -rf lambda-release || true
mkdir -p "lambda-release" || true
cp -rfv lambda/ lambda-release

docker run -it --rm -v $(pwd)/lambda-release:/build -w /build node:12 npm install

##smoke test to make sure the code is not broken
docker run -it --rm -v $(pwd)/lambda-release:/build -w /build node:12 node lambda.js

cp -f lambda-release/package-lock.json lambda/

