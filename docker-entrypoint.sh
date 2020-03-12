#!/bin/sh

echo "ENTRYPOINT"

if [ "$1" = 'start' ]; then
    yarn migrate
    yarn start
fi

exec yarn $@
