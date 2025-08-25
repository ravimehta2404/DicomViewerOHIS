# 1) Create deployment folder
sudo mkdir -p /opt/orthanc-docker/plugins/python
cd /opt/orthanc-docker

# 2) Dockerfile: Orthanc + plugins (Python, Explorer2, DICOMweb)
sudo chown -R $USER:$USER /opt/orthanc-docker

cd /opt/orthanc-docker
sudo tee Dockerfile > /dev/null <<'EOF'
FROM orthancteam/orthanc:25.2.0
USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
    orthanc-postgresql \
    orthanc-python \
  && rm -rf /var/lib/apt/lists/*
USER orthanc
EOF


# 2.1) .env file :

cd /opt/orthanc-docker

sudo tee .env > /dev/null <<'EOF'
# Orthanc admin user (do not commit this file)
ORTHANC_ADMIN_PASSWORD=OrthancWeb_RAD_987#

# AWS RDS Postgres connection
RDS_HOST=eminencedbinstance.ckixvmofumsp.ap-south-1.rds.amazonaws.com
RDS_DB=radflare_orthanc_web
RDS_USER=eminence
RDS_PASSWORD=xy5wHLAgNfvUwY6Vby6z

# Python plugin env for your webhook integration
ORTHANC_PLUGIN_RADFLARE_API_URL=https://telepacs.radflare.com/api/v1/webhooks/orthanc
ORTHANC_PLUGIN_API_KEY=test-key
ORTHANC_PLUGIN_QUEUE_TYPE=persistent
ORTHANC_PLUGIN_PERSISTENT_QUEUE_PATH=/var/lib/orthanc/queue
ORTHANC_PLUGIN_MAX_RETRIES=1
ORTHANC_PLUGIN_INITIAL_RETRY_DELAY=20
ORTHANC_PLUGIN_MAX_RETRY_DELAY=60
ORTHANC_PLUGIN_RETRY_BACKOFF_FACTOR=2
EOF


# 3) Orthanc config (all settings except DB credentials)
cd /opt/orthanc-docker
sudo tee orthanc.json > /dev/null <<'EOF'
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
      "http://3.108.64.88:8042",
      "http://ec2-3-108-64-88.ap-south-1.compute.amazonaws.com:8042"
    ],
    "CorsAllowedHeaders": "Origin, Accept, Authorization, Content-Type, X-Requested-With",
    "CorsExposedHeaders": "Location, Content-Location",
    "CorsAllowCredentials": false,
    "CorsMaxAge": 3600
  },

  "HttpHeaders": {
    "Access-Control-Allow-Origin": "http://localhost:3001 http://127.0.0.1:3001 http://3.108.64.88:8042 http://ec2-3-108-64-88.ap-south-1.compute.amazonaws.com:8042",
    "Access-Control-Allow-Headers": "accept, authorization, content-type, origin, x-requested-with",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
  },

  "Python": {
    "Path": "/etc/orthanc/python/orthanc_plugin.py",
    "Verbose": false
  }
}
EOF


# 4) docker-compose file using build + env file
cd /opt/orthanc-docker

sudo tee docker-compose.yml > /dev/null <<'EOF'
version: "3.8"
services:
  orthanc:
    build: .
    container_name: orthanc
    restart: unless-stopped
    ports:
      - "8042:8042"      # temporary to avoid conflict with current 8042
      - "4242:4242"
    environment:
      ORTHANC_JSON: /etc/orthanc/orthanc.json

      # Auth
      ORTHANC__AUTHENTICATIONENABLED: "true"
      ORTHANC__REGISTEREDUSERS__admin: ${ORTHANC_ADMIN_PASSWORD}

      # PostgreSQL (RDS)
      ORTHANC__POSTGRESQL__ENABLEINDEX: "true"
      ORTHANC__POSTGRESQL__ENABLESTORAGE: "true"
      ORTHANC__POSTGRESQL__HOST: ${RDS_HOST}
      ORTHANC__POSTGRESQL__PORT: "5432"
      ORTHANC__POSTGRESQL__DATABASE: ${RDS_DB}
      ORTHANC__POSTGRESQL__USERNAME: ${RDS_USER}
      ORTHANC__POSTGRESQL__PASSWORD: ${RDS_PASSWORD}
      ORTHANC__POSTGRESQL__ENABLESSL: "true"

      # Python plugin env (forwarded into container)
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
      - ./plugins/python:/etc/orthanc/python:ro
      - orthanc_data:/var/lib/orthanc

    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:8042/"]
      interval: 15s
      timeout: 5s
      retries: 10

volumes:
  orthanc_data:
EOF


# 5) Python plugin (copy existing plugin via scp)
sudo mkdir -p /opt/orthanc-docker/plugins/python
sudo chown -R $USER:$USER /opt/orthanc-docker
sudo chmod -R u+rwX,go+rX /opt/orthanc-docker
cd /opt/orthanc-docker
#
scp -i /path/to/key.pem /path/to/docs/orthanc_plugin.py ubuntu@3.108.64.88:/opt/orthanc-docker/plugins/python/orthanc_plugin.py


# 6) Build and run
cd /opt/orthanc-docker
docker compose up -d --build
docker compose ps
docker compose logs -f orthanc | sed -n '1,120p'

# 6.1) # Install Docker Engine + Compose plugin (official repo)
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker

# Verify install
sudo docker --version
sudo docker compose version

# Start Orthanc
cd /opt/orthanc-docker
sudo docker compose up -d --build
sudo docker compose ps

# Quick check (uses admin password from .env)
PW=$(grep -E '^ORTHANC_ADMIN_PASSWORD=' .env | cut -d= -f2)
curl -u admin:$PW -I http://localhost:8052/ | cat
curl -u admin:$PW -s http://localhost:8052/dicom-web/studies | head -c 200 | cat


# 7) Quick checks
curl -I http://localhost:8042/
curl -s http://localhost:8042/dicom-web/studies | head -c 200
echo "Open http://3.108.64.88:8042/app/explorer.html in your browser"





## check existing orthanc running process:

sudo ss -ltnp | grep ':8042' || sudo lsof -iTCP:8042 -sTCP:LISTEN -n -P

ps -fp 642306
sudo readlink -f /proc/642306/exe
sudo cat /proc/642306/cmdline | tr '\0' ' '
sudo ls -l /proc/642306/cwd
sudo cat /proc/642306/environ | tr '\0' '\n' | grep -E 'ORTHANC|PORT|PYTHON' | head -n 50


# Check if it’s a systemd service or a package install
sudo systemctl status orthanc || true
sudo systemctl list-units | grep -i orthanc || true
dpkg -l | grep -i orthanc || true
which Orthanc || which orthanc || true


# Sanity check for container runtimes
which docker || true
which podman || true
sudo podman ps --format '{{.Names}}\t{{.Ports}}' | grep 8042 || true




## OHIF VIEWR setup
# on Local machine
cd /Users/ravimehta/Documents/Workspace/study/pacs/dicom_viewer_ohis/platform/app && PUBLIC_URL=/ohif/ APP_CONFIG=config/tele.js yarn build:viewer

# On EC2:
sudo chown -R ubuntu:ubuntu /opt/ohif-nginx/html/ohif
sudo chmod -R u+rwX,go+rX /opt/ohif-nginx/html/ohif

# on Local machine
ssh -i /Users/ravimehta/.ssh/radflare-dicom-server.pem ubuntu@65.1.107.198 'sudo mkdir -p /opt/ohif-nginx/html/ohif'
rsync -avz -e "ssh -i /Users/ravimehta/.ssh/radflare-dicom-server.pem" /Users/ravimehta/Documents/Workspace/study/pacs/dicom_viewer_ohis/platform/app/dist/ ubuntu@65.1.107.198:/opt/ohif-nginx/html/ohif/


# Run on EC2:
Next step: install and configure Nginx to serve /ohif/ and proxy /dicom-web to Orthanc.
sudo apt-get update && sudo apt-get install -y nginx

sudo tee /etc/nginx/sites-available/ohif.conf > /dev/null <<'EOF'
server {
  listen 80 default_server;
  server_name _;

  # Serve OHIF SPA from /dicom/
  location /dicom/ {
    alias /opt/ohif-nginx/html/ohif/;
    try_files $uri $uri/ /dicom/index.html;
  }

  # Proxy DICOMweb to Orthanc (same-origin)
  location /dicom-web/ {
    proxy_pass http://127.0.0.1:8042/dicom-web/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Connection "";
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }

  # Proxy WADO-URI (optional)
  location /wado {
    proxy_pass http://127.0.0.1:8042/wado;
    proxy_set_header Host $host;
  }

  location = /health { return 200 'ok'; add_header Content-Type text/plain; }
}
EOF
sudo ln -sf /etc/nginx/sites-available/ohif.conf /etc/nginx/sites-enabled/ohif.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
