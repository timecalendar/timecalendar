#!/bin/bash

export SERVER_IMAGE_NAME=ghcr.io/timecalendar/timecalendar
export WEB_IMAGE_NAME=ghcr.io/timecalendar/timecalendar-web

export SERVER_IMAGE_NAME_WITH_TAG=$SERVER_IMAGE_NAME:$GITHUB_SHA
export WEB_IMAGE_NAME_WITH_TAG=$WEB_IMAGE_NAME:$GITHUB_SHA

# Tags to push. The bare $GITHUB_SHA tag is always pushed (tests consume it).
# On main, also push the main-<sha> tag that argocd-image-updater watches.
export SERVER_IMAGES_WITH_TAG_TO_PUSH=$SERVER_IMAGE_NAME_WITH_TAG
export WEB_IMAGES_WITH_TAG_TO_PUSH=$WEB_IMAGE_NAME_WITH_TAG
if [[ $GITHUB_REF == 'refs/heads/main' ]]; then
  SERVER_IMAGES_WITH_TAG_TO_PUSH+=", $SERVER_IMAGE_NAME:main-$GITHUB_SHA"
  WEB_IMAGES_WITH_TAG_TO_PUSH+=", $WEB_IMAGE_NAME:main-$GITHUB_SHA"
fi

echo "[server] Tags to push: $SERVER_IMAGES_WITH_TAG_TO_PUSH"
echo "[web] Tags to push: $WEB_IMAGES_WITH_TAG_TO_PUSH"

echo "SERVER_IMAGE_NAME_WITH_TAG=$SERVER_IMAGE_NAME_WITH_TAG" >> "$GITHUB_ENV"
echo "WEB_IMAGE_NAME_WITH_TAG=$WEB_IMAGE_NAME_WITH_TAG" >> "$GITHUB_ENV"
echo "SERVER_IMAGES_WITH_TAG_TO_PUSH=$SERVER_IMAGES_WITH_TAG_TO_PUSH" >> "$GITHUB_ENV"
echo "WEB_IMAGES_WITH_TAG_TO_PUSH=$WEB_IMAGES_WITH_TAG_TO_PUSH" >> "$GITHUB_ENV"
echo "DOCKER_TAG=$GITHUB_SHA" >> "$GITHUB_ENV"
