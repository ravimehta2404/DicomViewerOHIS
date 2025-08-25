## AWS Orthanc + OHIF Deployment (EC2 Ubuntu)

This document captures the exact setup used to deploy Orthanc (with PostgreSQL on AWS RDS, DICOMweb, optional Python plugin) and serve the OHIF Viewer via Nginx on an EC2 instance.

### 0) Prerequisites
- EC2: Ubuntu 24.04; recommended t3.small/t3.medium
- Security Groups (adjust to your IP/org needs):
  - 80/tcp (HTTP) inbound: your IP
  - 8042/tcp (Orthanc UI/REST/DICOMweb) inbound: your IP (or private only)
  - 4242/tcp (DICOM DIMSE) inbound: as needed (modalities)
  - RDS SG: allow 5432/tcp from this EC2 instance SG

### 1) Install Docker + Compose
```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
```

### 2) Orthanc project layout
```bash
sudo mkdir -p /opt/orthanc-docker/plugins/python
sudo chown -R $USER:$USER /opt/orthanc-docker
cd /opt/orthanc-docker
```

#### 2.1) .env file
```bash
cat > .env <<'EOF'
ORTHANC_ADMIN_PASSWORD=change-this

# AWS RDS Postgres
RDS_HOST=your-rds-endpoint.amazonaws.com
RDS_DB=radflare_orthanc_web
RDS_USER=orthanc
RDS_PASSWORD=strong-password

# Optional Python plugin (your app webhook)
ORTHANC_PLUGIN_RADFLARE_API_URL=https://your-host/api/v1/webhooks/orthanc
ORTHANC_PLUGIN_API_KEY=your-secret
ORTHANC_PLUGIN_QUEUE_TYPE=persistent
ORTHANC_PLUGIN_PERSISTENT_QUEUE_PATH=/var/lib/orthanc/queue
ORTHANC_PLUGIN_MAX_RETRIES=1
ORTHANC_PLUGIN_INITIAL_RETRY_DELAY=20
ORTHANC_PLUGIN_MAX_RETRY_DELAY=60
ORTHANC_PLUGIN_RETRY_BACKOFF_FACTOR=2
EOF
```

#### 2.2) Dockerfile
```dockerfile
FROM orthancteam/orthanc:25.2.0
USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
    orthanc-postgresql \
    orthanc-python \
    python3-requests \
  && rm -rf /var/lib/apt/lists/*
USER orthanc
```

#### 2.3) orthanc.json (no secrets)
```json
{
  "Name": "RadflareTeleOrthancWeb",
  "LoadPlugins": true,
  "AuthenticationEnabled": true,
  "RemoteAccessAllowed": true,

  "OrthancExplorer2": { "Enable": true, "IsDefaultOrthancUI": true },

  "DicomWeb": {
    "Enable": true,
    "Root": "/dicom-web",
    "EnableWado": true,
    "WadoRoot": "/wado",
    "Ssl": false,
    "QidoCaseSensitive": false
  },

  "HttpServer": {
    "CorsEnabled": true,
    "CorsOrigins": [
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "http://<your-ec2-ip>:8042"
    ],
    "CorsAllowedHeaders": "Origin, Accept, Authorization, Content-Type, X-Requested-With",
    "CorsExposedHeaders": "Location, Content-Location",
    "CorsAllowCredentials": false,
    "CorsMaxAge": 3600
  },

  "HttpHeaders": {
    "Access-Control-Allow-Origin": "http://localhost:3001 http://127.0.0.1:3001 http://<your-ec2-ip>:8042",
    "Access-Control-Allow-Headers": "accept, authorization, content-type, origin, x-requested-with",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
  }
}
```

#### 2.4) PostgreSQL config
Option A (flags file):
```json
{
  "PostgreSQL": {
    "EnableIndex": true,
    "EnableStorage": true,
    "EnableSsl": true
  }
}
```
Option B (URI with SSL):
```json
{
  "PostgreSQL": {
    "EnableIndex": true,
    "EnableStorage": true,
    "ConnectionUri": "postgresql://RDS_USER:RDS_PASSWORD@RDS_HOST:5432/RDS_DB?sslmode=require"
  }
}
```

Save as `/opt/orthanc-docker/postgresql.json`.

#### 2.5) Registered user file (maps admin from .env)
```bash
PW=$(grep -E '^ORTHANC_ADMIN_PASSWORD=' .env | cut -d= -f2)
cat > registered-users.json <<EOF
{ "RegisteredUsers": { "admin": "$PW" } }
EOF
```

#### 2.6) Optional Python plugin
Place your plugin at `/opt/orthanc-docker/plugins/python/orthanc_plugin.py`.
- Ensure it doesn’t write logs under `/etc`; prefer `/var/lib/orthanc/plugin-logs`.
- The image installs `python3-requests` for `import requests`.

#### 2.7) docker-compose.yml
```yaml
services:
  orthanc:
    build: .
    container_name: orthanc
    restart: unless-stopped
    ports:
      - "8042:8042"
      - "4242:4242"
    environment:
      ORTHANC__AUTHENTICATIONENABLED: "true"
      ORTHANC__REGISTEREDUSERS__admin: ${ORTHANC_ADMIN_PASSWORD}
      ORTHANC__POSTGRESQL__ENABLEINDEX: "true"
      ORTHANC__POSTGRESQL__ENABLESTORAGE: "true"
      ORTHANC__POSTGRESQL__HOST: ${RDS_HOST}
      ORTHANC__POSTGRESQL__PORT: "5432"
      ORTHANC__POSTGRESQL__DATABASE: ${RDS_DB}
      ORTHANC__POSTGRESQL__USERNAME: ${RDS_USER}
      ORTHANC__POSTGRESQL__PASSWORD: ${RDS_PASSWORD}
      ORTHANC__POSTGRESQL__ENABLESSL: "true"
      # Optional plugin env
      ORTHANC_PLUGIN_RADFLARE_API_URL: ${ORTHANC_PLUGIN_RADFLARE_API_URL}
      ORTHANC_PLUGIN_API_KEY: ${ORTHANC_PLUGIN_API_KEY}
      ORTHANC_PLUGIN_QUEUE_TYPE: ${ORTHANC_PLUGIN_QUEUE_TYPE}
      ORTHANC_PLUGIN_PERSISTENT_QUEUE_PATH: ${ORTHANC_PLUGIN_PERSISTENT_QUEUE_PATH}
      ORTHANC_PLUGIN_MAX_RETRIES: ${ORTHANC_PLUGIN_MAX_RETRIES}
      ORTHANC_PLUGIN_INITIAL_RETRY_DELAY: ${ORTHANC_PLUGIN_INITIAL_RETRY_DELAY}
      ORTHANC_PLUGIN_MAX_RETRY_DELAY: ${ORTHANC_PLUGIN_MAX_RETRY_DELAY}
      ORTHANC_PLUGIN_RETRY_BACKOFF_FACTOR: ${ORTHANC_PLUGIN_RETRY_BACKOFF_FACTOR}
    volumes:
      - ./orthanc.json:/etc/orthanc/orthanc.json:ro
      - ./postgresql.json:/etc/orthanc/postgresql.json:ro
      - ./registered-users.json:/etc/orthanc/registered-users.json:ro
      - ./plugins/python:/etc/orthanc/python:ro
      # Optional: load your plugin as sample.py
      # - ./plugins/python/orthanc_plugin.py:/etc/orthanc/sample.py:ro
      - orthanc_data:/var/lib/orthanc
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:8042/"]
      interval: 15s
      timeout: 5s
      retries: 10

volumes:
  orthanc_data:
```

### 3) Bring Orthanc up
```bash
cd /opt/orthanc-docker
sudo docker compose up -d --build
sudo docker compose logs --tail=120 orthanc | sed -n '1,120p'
```
Healthy logs show:
- Explorer 2 registered; root: `/ui/`
- DICOMweb registered; root: `/dicom-web/`
- PostgreSQL index/storage enabled; no “disabled” messages
- HTTP server listening on port: 8042

Test locally and remotely:
```bash
curl -I http://localhost:8042/ui/app/
curl -u admin:$PW -s http://localhost:8042/dicom-web/studies | head -c 200 | cat
```
Remote UI (Explorer 2): `http://<EC2_PUBLIC_IP>:8042/ui/app/#/`

Troubleshooting:
- Port conflict: stop legacy `orthanc.service` (systemd) before mapping 8042/4242
- RDS FATAL no pg_hba / no encryption: enable SSL or use URI with `sslmode=require`; open RDS SG
- Plugin crash-loop (`No module named 'requests'`): install `python3-requests` or temporarily remove mapping

### 4) Install Nginx to serve OHIF and proxy DICOMweb (optional, recommended)
```bash
sudo apt-get update && sudo apt-get install -y nginx
sudo mkdir -p /opt/ohif-nginx/html/ohif
sudo chown -R ubuntu:ubuntu /opt/ohif-nginx/html/ohif

sudo tee /etc/nginx/sites-available/ohif.conf > /dev/null <<'EOF'
server {
  listen 80 default_server;
  server_name _;

  location /ohif/ {
    alias /opt/ohif-nginx/html/ohif/;
    try_files $uri $uri/ /ohif/index.html;
  }

  location /dicom-web/ {
    proxy_pass http://127.0.0.1:8042/dicom-web/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Connection "";
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  location /wado {
    proxy_pass http://127.0.0.1:8042/wado;
    proxy_set_header Host $host;
  }
}
EOF
sudo ln -sf /etc/nginx/sites-available/ohif.conf /etc/nginx/sites-enabled/ohif.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
```

### 5) Build and upload the OHIF Viewer
Build locally (macOS):
```bash
cd <repo>/platform/app
# Option A (same-origin proxy via Nginx)
PUBLIC_URL=/ohif/ APP_CONFIG=config/default.js yarn build:viewer

# In config/default.js for same-origin proxy:
# routerBasename: '/ohif/'
# dataSources roots: '/dicom-web'

# Option B (direct to Orthanc on 8042)
# Set wado/qido roots to: 'http://<EC2_PUBLIC_IP>:8042/dicom-web'
```

Upload to EC2:
```bash
rsync -avz -e "ssh -i /path/to/key.pem" <repo>/platform/app/dist/ ubuntu@<EC2_PUBLIC_IP>:/opt/ohif-nginx/html/ohif/
```

Test:
- OHIF root: `http://<EC2_PUBLIC_IP>/ohif/`
- Viewer: `http://<EC2_PUBLIC_IP>/ohif/viewer?StudyInstanceUIDs=<UID>`
- Orthanc UI: `http://<EC2_PUBLIC_IP>:8042/ui/app/#/`
- DICOMweb: `http://<EC2_PUBLIC_IP>:8042/dicom-web/studies`

### 6) Integration tips
- Iframe base URL for your app: set `REACT_APP_OHIF_URL=http://<EC2_PUBLIC_IP>`
- Use: `/ohif/viewer?StudyInstanceUIDs=<UID>`

### 7) Security hardening (next)
- Restrict SGs to trusted ranges
- Add HTTPS (Let’s Encrypt) on Nginx
- Add CSP (`frame-ancestors`) for your app domain
- Rotate Orthanc admin password; consider Orthanc auth backends / proxy auth

### Current deployed endpoints
- Orthanc Explorer 2: `http://65.1.107.198:8042/ui/app/#/`
- OHIF Viewer root: `http://65.1.107.198/ohif/`
- DICOMweb: `http://65.1.107.198:8042/dicom-web/`
