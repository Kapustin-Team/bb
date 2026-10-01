FROM node:24-bookworm
ARG BB_REVISION
LABEL org.opencontainers.image.source="https://github.com/Kapustin-Team/bb" org.opencontainers.image.revision="${BB_REVISION}"
COPY bb-app.tgz /tmp/bb-app.tgz
RUN npm install --global /tmp/bb-app.tgz && chmod 755 /usr/local/lib/node_modules/bb-app/host-daemon/dist/bb && rm /tmp/bb-app.tgz && npm cache clean --force
USER node
WORKDIR /home/node
ENV HOME=/home/node BB_DATA_DIR=/home/node/.bb BB_TELEMETRY=false
CMD ["bb-app","--data-dir","/home/node/.bb","--server-bind-host","0.0.0.0","--server-port","38886","--host-daemon-port","38887"]
