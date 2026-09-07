#!/bin/sh
# Batch 0 readiness placeholder: checks GDS availability only.
# This does not apply schema migrations; Batch 1 supplies real migrations.
set -eu

if [ -z "${NEO4J_URI:-}" ] || [ -z "${NEO4J_USERNAME:-}" ] || [ -z "${NEO4J_PASSWORD:-}" ]; then
    printf '%s\n' 'GDS readiness check failed: required connection settings are missing.' >&2
    exit 1
fi

# Every query is bounded as well as the overall number of retries.
attempt=1
while [ "$attempt" -le 30 ]; do
    if timeout 10s cypher-shell \
        -a "$NEO4J_URI" -u "$NEO4J_USERNAME" -p "$NEO4J_PASSWORD" \
        'RETURN gds.version();' >/dev/null 2>&1; then
        printf '%s\n' 'GDS readiness check succeeded.'
        exit 0
    fi
    printf '%s\n' "GDS readiness pending ($attempt/30)."
    if [ "$attempt" -lt 30 ]; then sleep 2; fi
    attempt=$((attempt + 1))
done

printf '%s\n' 'GDS readiness check failed after 30 attempts.' >&2
exit 1
