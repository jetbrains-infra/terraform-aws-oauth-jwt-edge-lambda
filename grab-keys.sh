#!/bin/bash

cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
set -e -x -u


rm -rf grab-release || true
rm -f lambda/jwks-generated.json || true
mkdir -p "grab-release" || true
cp -rf grab-keys/ grab-release
rm -rf grab-release/node_modules


## grab actual keys
docker run -it --rm -v $(pwd)/grab-release:/build -w /build node:12 npm install
docker run -it --rm -v $(pwd)/grab-release:/build -w /build node:12 node main.js

cp -fv grab-release/package-lock.json grab-keys/
cp -fv grab-release/jwks-generated.json lambda/

