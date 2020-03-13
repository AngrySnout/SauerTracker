#!/bin/sh

./wait-for-it.sh postgres:5432

if [ "$1" = 'start' ]; then
    yarn migrate
    yarn start
fi

exec yarn $@
