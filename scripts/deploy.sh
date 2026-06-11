#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="${DEPLOY_DIR:-/var/www/blog/dist}"
SKIP_GIT_PULL="${SKIP_GIT_PULL:-0}"
NGINX_TEST_CMD="${NGINX_TEST_CMD:-nginx -t}"
RELOAD_CMD="${RELOAD_CMD:-systemctl reload nginx}"

cd "$PROJECT_ROOT"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "缺少命令：$1"
    case "$1" in
      npm)
        echo "请先安装 Node.js 和 npm。"
        ;;
      rsync)
        echo "请先安装 rsync：apt install -y rsync"
        ;;
      nginx)
        echo "请先安装 Nginx：apt install -y nginx"
        ;;
    esac
    exit 1
  fi
}

require_command npm
require_command rsync
require_command nginx

if [[ ! -f package.json || ! -f scripts/build.js ]]; then
  echo "当前目录不是博客项目根目录：$PROJECT_ROOT"
  exit 1
fi

echo "==> 项目目录：$PROJECT_ROOT"

if [[ "$SKIP_GIT_PULL" != "1" ]]; then
  require_command git
  echo "==> 拉取最新代码"
  git pull --ff-only
fi

echo "==> 安装依赖"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo "==> 构建 dist"
npm run build

if [[ ! -f dist/index.html ]]; then
  echo "构建失败：dist/index.html 不存在"
  exit 1
fi

echo "==> 同步到 Nginx 目录：$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"
rsync -av --delete dist/ "$DEPLOY_DIR/"

echo "==> 检查 Nginx 配置"
$NGINX_TEST_CMD

echo "==> 重载 Nginx"
$RELOAD_CMD

echo "部署完成：$DEPLOY_DIR"
