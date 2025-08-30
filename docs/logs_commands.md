## Logs and Diagnostics – Orthanc, Nginx, OHIF

### Orthanc (Docker Compose)
```bash
cd /opt/orthanc-docker

# Show recent Orthanc logs
sudo docker compose logs --tail=200 orthanc | sed -n '1,200p'

# Follow logs live
sudo docker compose logs -f orthanc

# Container status
sudo docker compose ps

# Inspect last restart reason
sudo docker inspect --format='{{.State.Status}} {{.State.ExitCode}} {{.State.Error}}' orthanc

# Inside container quick checks
sudo docker exec -it orthanc bash -lc 'curl -I http://localhost:8042/ | cat'
sudo docker exec -it orthanc bash -lc 'curl -s http://localhost:8042/dicom-web/studies | head -c 200 | cat'

# Host port listeners
ss -ltnp | grep -E ':8042|:4242' || true
```

### Orthanc DICOMweb quick tests (from EC2 host)
```bash
PW=$(grep -E '^ORTHANC_ADMIN_PASSWORD=' /opt/orthanc-docker/.env | cut -d= -f2)
curl -u admin:$PW -I http://localhost:8042/ | cat
curl -u admin:$PW -s http://localhost:8042/dicom-web/studies | head -c 200 | cat
```

### Nginx (serving OHIF and proxying DICOMweb)
```bash
# Service status
sudo systemctl status nginx --no-pager

# Config test
sudo nginx -t

# Restart
sudo systemctl restart nginx

# Access/Error logs (Ubuntu)
sudo tail -n 200 /var/log/nginx/access.log
sudo tail -n 200 /var/log/nginx/error.log

# Journal (if needed)
sudo journalctl -u nginx -n 200 --no-pager

# HTTP checks (from EC2)
curl -I http://localhost/ohif/ | cat
curl -u admin:$PW -s http://localhost/dicom-web/studies | head -c 200 | cat
```

### Remote HTTP checks (from your laptop)
```bash
# OHIF root
curl -I http://<EC2_PUBLIC_IP>/ohif/ | cat

# Orthanc Explorer 2 UI
curl -I http://<EC2_PUBLIC_IP>:8042/ui/app/ | cat

# DICOMweb via Nginx proxy
curl -u admin:<password> -s http://<EC2_PUBLIC_IP>/dicom-web/studies | head -c 200 | cat
```

### OHIF build logs (local)
```bash
cd platform/app
PUBLIC_URL=/ohif/ APP_CONFIG=config/default.js yarn build:viewer

# If using dev server
yarn dev
```

### Deployment sync (local → EC2)
```bash
rsync -avz -e "ssh -i /path/to/key.pem" platform/app/dist/ ubuntu@<EC2_PUBLIC_IP>:/opt/ohif-nginx/html/ohif/
```

### Common issues and quick clues
- Orthanc crash-loop: check for Python plugin errors (e.g., `No module named 'requests'`).
- RDS connection errors: ensure `sslmode=require` or `EnableSsl=true`, and RDS SG allows EC2.
- 404 on `/ohif/`: ensure Nginx site is enabled and `try_files ... /ohif/index.html` is present.
- 401 on Orthanc: verify `RegisteredUsers` mapping or env `ORTHANC__REGISTEREDUSERS__admin`.
