#!/bin/zsh

cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
set -e -x -u

VERSION=$1
BRANCH="release-$VERSION"
echo "Releasing version: $VERSION"

git stash
git checkout -b $BRANCH

./build-lambda.sh

git add -f lambda-release/**
git commit lambda-release/** -m "include binaries for the release"

git push origin $BRANCH:$BRANCH

echo "Version branch is ready - it is time to add a release on GitHub"

