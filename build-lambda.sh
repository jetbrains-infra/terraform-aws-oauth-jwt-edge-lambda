#!/bin/bash

cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
set -e -x -u

## this script should be used to create a release package as we include
## binaries in this repo to simplify the process

rm -rf lambda-release || true
mkdir -p "lambda-release" || true
cp -rf lambda/ lambda-release

if [ "${1:-X}" == "dev" ]; then
  echo "Development mode"

  terraform init lambda-zip
  terraform apply -auto-approve -var generate_template_locally=true lambda-zip

  echo "Running test.js, make sure you have valid token in the code"
  node lambda-release/test.js

  exit 0;
fi

rm -rf lambda-release/node_modules || true
rm -rf lambda-release/package-lock.json || true
cp -f lambda-release/jwks-generated.stub lambda-release/jwks-generated.js

## deal with lambda preparations
docker run -it --rm -v $(pwd)/lambda-release:/build -w /build node:12 npm install

## smoke test to make sure the code is not broken
docker run -it --rm -v $(pwd)/lambda-release:/build -w /build node:12 node lambda.js
docker run -it --rm -v $(pwd)/lambda-release:/build -w /build node:12 node test.js

rm -f lambda-release/test.js

cp -fv lambda-release/package-lock.json lambda/
rm -rf lambda-release/jwks-generated.stub lambda-release/jwks-generated.js

git add -f lambda/package-lock.json

