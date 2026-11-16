#!/usr/bin/env bash
set -euo pipefail

result=skip
while IFS= read -r path; do
  case "$path" in
    ''|README.md|docs/*|.scratch/*) ;;
    *) result=deploy ;;
  esac
done
printf '%s\n' "$result"
