#!/bin/zsh

cd "$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
set -e -x -u

VERSION=$1
BRANCH="release-jba-jbt-$VERSION"
TAG=$VERSION-jba-jbt
echo "Releasing version: $VERSION"

git stash
git checkout -b $BRANCH

rm -rf lambda-release || true
./build-lambda.sh

git add -f lambda-release/**
git commit lambda-release/** -m "include binaries for the release"

git tag -a -m "release $BRANCH" $TAG
git push origin $BRANCH:$BRANCH $TAG

echo "Version branch is ready - it is time to add a release on GitHub"

