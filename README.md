# Notes Frontend

This static HTML, CSS, and JavaScript Notes interface is designed for a public-subnet frontend EC2 instance. Nginx serves the files and proxies browser requests for `/api/` to the private FastAPI backend. The browser never receives the backend's private address.

```text
Browser -> Nginx on frontend EC2 -> private backend:8000 -> PostgreSQL
```

## Local development

Start FastAPI locally on port 8000, then run:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Open <http://127.0.0.1:8080>. Local `config.js` uses `http://127.0.0.1:8000`; edit it only when your local API runs elsewhere. Create, list, and delete a note to verify the interface.


## Ubuntu 24.04 LTS deployment

Prerequisites:

- Ubuntu Server 24.04 LTS frontend EC2 instance.
- This repository available on the instance.
- Outbound package access for installing Nginx.
- Private network connectivity to the backend on TCP port 8000.
- The backend security group permits TCP 8000 from the frontend security group.

This script does not create AWS resources.

Run from the repository root:

```bash
chmod +x deploy/deploy-ubuntu.sh

sudo env \
  BACKEND_HOST=BACKEND_PRIVATE_DNS_OR_IP \
  BACKEND_PORT=8000 \
  ./deploy/deploy-ubuntu.sh
```

Replace `BACKEND_PRIVATE_DNS_OR_IP` with the actual private address or resolvable private DNS name of the backend.

The script installs Nginx, copies the static files to
`/var/www/notes-frontend`, writes the Nginx configuration, validates it,
and enables the service.

The browser sends API requests to the same frontend origin.
Nginx removes the `/api/` prefix before forwarding requests to FastAPI.

Verify:

```bash
sudo nginx -t
sudo systemctl status nginx
curl -i http://127.0.0.1/
curl -i http://127.0.0.1/api/health
sudo tail -n 100 /var/log/nginx/error.log
```

If `/api/health` returns `502 Bad Gateway`, check the backend service,
private address, network routes, and security-group rules.

Do not expose the backend or PostgreSQL to the public internet.


## (old) Amazon Linux 2023 deployment

Prerequisites: an Amazon Linux 2023 frontend EC2 instance, repository files present on that instance, outbound package access for `dnf`, and private network/security-group access from the frontend instance to the backend on TCP 8000. This repository and script do **not** create EC2 instances, security groups, databases, or any other AWS resource.

Set `BACKEND_HOST` to a stable private DNS name (preferred) or private IP for the backend. Do not use a public backend address or an ephemeral IP. From the repository root on the frontend instance:

```bash
chmod +x deploy/deploy-amazon-linux.sh
sudo BACKEND_HOST=backend.internal.example BACKEND_PORT=8000 ./deploy/deploy-amazon-linux.sh
```

The script installs only Nginx, copies this frontend to `/var/www/notes-frontend`, writes `/etc/nginx/conf.d/notes-frontend.conf`, runs `nginx -t`, and enables/reloads Nginx. It does not install the backend or PostgreSQL. Rerunning it safely replaces only the application files and its own `notes-frontend.conf` file.

The generated proxy removes the `/api/` prefix: `/api/notes` becomes `http://BACKEND_HOST:BACKEND_PORT/notes`, matching FastAPI's routes. To point at a replacement backend, rerun the same command with the new `BACKEND_HOST`; no JavaScript change is required.

Verify deployment:

```bash
sudo nginx -t
sudo systemctl status nginx
curl -i http://127.0.0.1/
curl -i http://127.0.0.1/api/health
sudo journalctl -u nginx -n 100 --no-pager
sudo tail -n 100 /var/log/nginx/error.log
```

If `/api/health` returns `502 Bad Gateway`, verify the backend process listens on port 8000, the configured private address is correct, and the backend security group permits inbound TCP 8000 from the frontend security group. Do not solve this by exposing the backend publicly or by using wildcard CORS.

## Docker option

The Docker image uses the official Nginx image and its template mechanism. It generates Nginx configuration from `BACKEND_HOST` and `BACKEND_PORT` when the container starts; the browser uses same-origin `/api`.

```bash
docker build -t notes-frontend .
docker run -d --name notes-frontend --restart unless-stopped -p 80:80 \
  -e BACKEND_HOST=backend.internal.example \
  -e BACKEND_PORT=8000 \
  notes-frontend
```

Inspect it with `docker logs notes-frontend` and `docker exec notes-frontend nginx -t`. Stop it with `docker stop notes-frontend`. This option does not install, run, or expose the backend or database.

## Security notes

For this temporary educational demo, HTTP is acceptable only while the frontend security group permits inbound TCP 80 solely from your current public IPv4 `/32`, and SSH is likewise restricted rather than opened to `0.0.0.0/0`. Production deployment should use HTTPS with a valid certificate, appropriate DNS, and broader production-grade controls. PostgreSQL remains private, and no AWS credentials, private keys, real environment files, or backend addresses are committed here.

