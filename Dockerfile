FROM nginx:1.27-alpine

ENV BACKEND_HOST=backend
ENV BACKEND_PORT=8000

COPY nginx/default.conf /etc/nginx/templates/default.conf.template
COPY index.html styles.css app.js /usr/share/nginx/html/
RUN printf '%s\n' 'window.NOTES_API_BASE_URL = "/api";' > /usr/share/nginx/html/config.js

EXPOSE 80
