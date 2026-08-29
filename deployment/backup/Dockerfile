FROM postgres:17-alpine

RUN apk add --no-cache bash restic

COPY deployment/backup/backup-now /usr/local/bin/backup-now
COPY deployment/backup/crontab /etc/crontabs/root
RUN chmod 0755 /usr/local/bin/backup-now

ENTRYPOINT []
CMD ["crond", "-f", "-l", "2"]
