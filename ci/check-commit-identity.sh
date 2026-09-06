#!/bin/sh

set -eu

EXPECTED_NAME='paperclip-timecalendar[bot]'
EXPECTED_EMAIL='325604666+paperclip-timecalendar[bot]@users.noreply.github.com'

[ -n "${PAPERCLIP_RUN_ID:-}" ] || exit 0

refuse() {
  field=$1
  printf '%s\n' \
    "Commit identity guard: expected $EXPECTED_NAME <$EXPECTED_EMAIL> as $field." \
    "The resolved $field identity differs and is withheld because this repository's logs are public." >&2
  exit 1
}

check_identity() {
  field=$1
  variable=$2
  ident=$(git var "$variable" 2>/dev/null) || refuse "$field"

  case "$ident" in
    "$EXPECTED_NAME <$EXPECTED_EMAIL> "*) ;;
    *) refuse "$field" ;;
  esac
}

check_identity author GIT_AUTHOR_IDENT
check_identity committer GIT_COMMITTER_IDENT
