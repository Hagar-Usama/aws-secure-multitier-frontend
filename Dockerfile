FROM nginx:1.27-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY index.html styles.css app.js /usr/share/nginx/html/
RUN printf '%s\n' 'window.NOTES_API_BASE_URL = "/api";' > /usr/share/nginx/html/config.js

EXPOSE 80
