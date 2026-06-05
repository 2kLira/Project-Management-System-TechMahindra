#!/usr/bin/env bash
# Configura una VM Ubuntu 24.04 para correr PMS dev + prod detrás de Caddy.
# Correr UNA sola vez, dentro de la VM, como el usuario admin (azureuser):
#   bash vm-setup.sh <IP_PUBLICA_DE_LA_VM>
set -euo pipefail

IP="${1:?Uso: bash vm-setup.sh <IP_PUBLICA_DE_LA_VM>}"

echo ">> [1/6] Paquetes base + Node 22 + build tools (argon2 compila nativo)"
sudo apt-get update
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential python3 rsync

echo ">> [2/6] pnpm + pm2 globales"
sudo npm install -g pnpm pm2

echo ">> [3/6] Caddy (reverse proxy + HTTPS automático Let's Encrypt)"
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
sudo apt-get update
sudo apt-get install -y caddy

echo ">> [4/6] Estructura /srv/pms"
sudo mkdir -p /srv/pms/prod/api /srv/pms/prod/web /srv/pms/dev/api /srv/pms/dev/web
sudo chown -R "$USER:$USER" /srv/pms

echo ">> [5/6] Swap de 2G (protege los pnpm install/build con 4GB de RAM)"
if [ ! -f /swapfile ]; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

echo ">> [6/6] Caddyfile  ( app.$IP.sslip.io = prod | dev.$IP.sslip.io = staging )"
sudo tee /etc/caddy/Caddyfile >/dev/null <<EOF
# Producción (rama main) -> backend en 127.0.0.1:8080
app.$IP.sslip.io {
    encode gzip
    root * /srv/pms/prod/web
    handle_path /api/* {
        reverse_proxy 127.0.0.1:8080
    }
    handle /ws* {
        reverse_proxy 127.0.0.1:8090
    }
    handle {
        try_files {path} /index.html
        file_server
    }
}

# Staging (rama dev) -> backend en 127.0.0.1:8081
dev.$IP.sslip.io {
    encode gzip
    root * /srv/pms/dev/web
    handle_path /api/* {
        reverse_proxy 127.0.0.1:8081
    }
    handle /ws* {
        reverse_proxy 127.0.0.1:8091
    }
    handle {
        try_files {path} /index.html
        file_server
    }
}
EOF
sudo systemctl reload caddy

# Arranque de pm2 al boot (imprime y ejecuta el comando systemd correcto)
sudo env PATH="$PATH" pm2 startup systemd -u "$USER" --hp "$HOME" || true

cat <<DONE

==================== LISTO ====================
Falta SOLO esto (manual, una vez):

1) Crea los .env de cada entorno (NO se versionan, NO se suben por CI):
   nano /srv/pms/prod/api/.env      # SUPABASE_URL, SUPABASE_KEY, JWT_SECRET (de tu proyecto Supabase PROD)
   nano /srv/pms/dev/api/.env       # idem, apuntando a tu proyecto Supabase DEV

2) En GitHub -> Settings -> Secrets and variables -> Actions, agrega:
   VM_HOST   = $IP
   VM_USER   = $USER
   VM_SSH_KEY = (contenido COMPLETO de tu llave privada .pem)

3) Abre puertos 80 y 443 en el NSG de la VM (Azure -> Networking).

4) Haz push a 'dev' o 'main' (o corre el workflow manual). El primer deploy
   construye el front, lo sube, instala el back y arranca pm2.

URLs:  https://app.$IP.sslip.io   (prod)
       https://dev.$IP.sslip.io   (dev)
===============================================
DONE
