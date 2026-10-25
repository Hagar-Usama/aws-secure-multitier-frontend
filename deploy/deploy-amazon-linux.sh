#!/usr/bin/env bash
set -euo pipefail

backend_host="${BACKEND_HOST:?Set BACKEND_HOST to the backend private DNS name or private IP.}"
backend_port="${BACKEND_PORT:-8000}"
script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
web_root="/var/www/notes-frontend"
nginx_config="/etc/nginx/conf.d/notes-frontend.conf"

require_root() {
  if [[ "$EUID" -ne 0 ]]; then
    echo "Run with sudo while supplying BACKEND_HOST and BACKEND_PORT." >&2
    exit 1
  fi
}

validate_backend_settings() {
  if [[ ! "$backend_host" =~ ^[A-Za-z0-9.-]+$ ]]; then
    echo "BACKEND_HOST may contain only letters, numbers, dots, and hyphens." >&2
    exit 1
  fi
  if [[ ! "$backend_port" =~ ^[0-9]+$ ]] || (( backend_port < 1 || backend_port > 65535 )); then
    echo "BACKEND_PORT must be an integer from 1 to 65535." >&2
    exit 1
  fi
}

install_nginx() {
  dnf install -y nginx
}

deploy_static_files() {
  install -d -m 0755 "$web_root"
  install -m 0644 "$script_directory/index.html" "$script_directory/styles.css" \
    "$script_directory/app.js" "$web_root/"
  printf '%s\n' 'window.NOTES_API_BASE_URL = "/api";' > "$web_root/config.js"
  chmod 0644 "$web_root/config.js"
}

write_nginx_config() {
  sed \
    -e "s|__BACKEND_HOST__|$backend_host|g" \
    -e "s|__BACKEND_PORT__|$backend_port|g" \
    "$script_directory/deploy/notes-frontend.conf.template" > "$nginx_config"
}

require_root
validate_backend_settings
install_nginx
deploy_static_files
write_nginx_config
nginx -t
systemctl enable --now nginx
systemctl reload nginx
echo "Deployment complete. Nginx proxies /api/ to ${backend_host}:${backend_port}."
