#!/bin/bash

cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
set -e -x -u

## this script should be used to create a release package as we include
## binaries in this repo to simplify the process

./grab-keys.sh

rm -rf lambda-release || true
mkdir -p "lambda-release" || true
cp -rf lambda/ lambda-release
rm -rf lambda-release/node_modules

## deal with lambda preparations
docker run -it --rm -v $(pwd)/lambda-release:/build -w /build node:12 npm install

## smoke test to make sure the code is not broken
docker run -it --rm -v $(pwd)/lambda-release:/build -w /build node:12 node lambda.js
docker run -it --rm -v $(pwd)/lambda-release:/build -w /build node:12 node test.js

cp -f lambda-release/package-lock.json lambda/
rm -f lambda-release/test.js
