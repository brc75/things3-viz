#!/bin/sh

cat ~/Library/Containers/com.culturedcode.ThingsMac/Data/Library/Application\ Support/Cultured\ Code/Things/Things.sqlite3 | \
curl -X POST -H 'X-Key: <key>' -F 'data=@-' http://<host>:5050/data