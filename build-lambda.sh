#!/bin/bash

cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
set -e -x -u

## this script should be used to create a release package as we include
## binaries in this repo to simplify the process

mkdir -p "lambda-release" || true

cp -rfv lambda/ lambda-release
rm -rf lambda-release/node_modules || true

docker run -it --rm -v $(pwd)/lambda-release:/build -w /build node:12 npm install
cp -f lambda-release/package-lock.json lambda/

