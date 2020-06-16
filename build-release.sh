#!/bin/zsh

./build-lambda.sh

git add -f lambda-release/**
git commit lambda-release/** -m "include binaries for the release"

