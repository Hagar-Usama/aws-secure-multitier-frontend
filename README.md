# Notes Frontend

The frontend is a static vanilla HTML/CSS/JavaScript Notes interface. It creates, lists, and deletes notes through the FastAPI API.

## Run locally

Start the backend first, then create the ignored local endpoint file and serve the current directory:

```bash
cp config.example.js config.js
python3 -m http.server 8080 --bind 127.0.0.1
```

Open <http://127.0.0.1:8080>. `config.js` sets `window.NOTES_API_BASE_URL`; the provided example uses `http://127.0.0.1:8000`. Change it if the backend uses another host or port.

## Nginx container behavior

The Dockerfile generates a container-only `config.js` with `/api`. `nginx/default.conf` proxies `/api/` to the Docker service name `backend:8000`, so browser calls stay on the frontend origin. Build it later with:

```bash
docker build -t notes-frontend .
```

