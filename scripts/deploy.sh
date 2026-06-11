#!/usr/bin/env bash
set -e

git pull --ff-only
npm ci
npm run build
rsync -av --delete dist/ /var/www/blog/dist/
nginx -t
systemctl reload nginx
