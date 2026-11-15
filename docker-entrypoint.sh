#!/bin/sh
set -e

# Merge the fresh build over the persistent HTML volume. cp adds new files and
# overwrites same-named ones (new index.html, sw.js) but never deletes files
# that exist only in the destination — so hashed chunks from previous deploys
# stay served and tabs running the old bundle keep fetching their lazy routes
# successfully instead of hitting "Failed to fetch dynamically imported module".
cp -a /opt/html/. /usr/share/nginx/html/

exec nginx -g 'daemon off;'
