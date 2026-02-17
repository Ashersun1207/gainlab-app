#!/usr/bin/env bash
# Typecheck app code, filtering out KLineChart fork errors.
# KLineChart is a vendored fork with known strict-mode issues;
# we only care about errors in our own app code.

set -o pipefail

OUTPUT=$(tsc -b 2>&1)
TSC_EXIT=$?

# Filter out KLineChart/klines errors (fork code we don't own)
APP_ERRORS=$(echo "$OUTPUT" \
  | grep ': error TS' \
  | grep -v 'KLineWidget/KLineChart/' \
  | grep -v 'KLineWidget/klines/')

if [ -n "$APP_ERRORS" ]; then
  echo "❌ TypeScript errors in app code:"
  echo "$APP_ERRORS"
  exit 1
fi

if [ $TSC_EXIT -ne 0 ]; then
  echo "✅ typecheck passed ($(echo "$OUTPUT" | grep -c ': error TS') KLineChart fork errors filtered)"
fi

exit 0
