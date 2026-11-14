# Übergabe für Pi-Agent

## Paketinhalt

- Image-Archiv: `__ARCHIVE_NAME__`
- Archivgröße: `__ARCHIVE_SIZE__`
- Compose-Datei: `docker-compose.yml`
- Dieses Dokument: `UEBERGABE.md`

Image-Name und Version: `denkspiele-web:1.0.0`

## Voraussetzungen auf dem Raspberry Pi

- 64-Bit-System (`aarch64`)
- Docker Engine installiert und laufend
- Docker Compose Plugin installiert (`docker compose`)

## Aufgaben auf dem Pi (nummeriert, mit Befehlen)

1. Voraussetzungen prüfen:
   ```bash
   uname -m
   docker version
   docker compose version
   ```
2. In den Paketordner wechseln und Image laden:
   ```bash
   cd <PAKET_ORDNER>
   docker load -i __ARCHIVE_NAME__
   docker image inspect denkspiele-web:1.0.0 --format '{{.Id}}'
   ```
3. Container mit Compose starten:
   ```bash
   docker compose -f docker-compose.yml up -d
   docker compose -f docker-compose.yml ps
   ```
4. Healthcheck und lokale Erreichbarkeit prüfen:
   ```bash
   docker inspect --format '{{json .State.Health}}' denkspiele-web
   curl -fsS http://127.0.0.1:8080/healthz
   curl -I http://127.0.0.1:8080/
   ```
5. Erreichbarkeit im Heimnetz prüfen (vom zweiten Gerät im selben Netz):
   - `http://<PI-LAN-ADRESSE>:8080` im Browser öffnen.
6. Autostart nach Pi-Neustart prüfen:
   ```bash
   sudo reboot
   # nach erneutem Login:
   docker compose -f <PAKET_ORDNER>/docker-compose.yml ps
   docker inspect --format '{{json .State.Health}}' denkspiele-web
   ```

## Späteres Update

1. Neues Paket auf den Pi kopieren.
2. In den neuen Paketordner wechseln und neues Archiv laden:
   ```bash
   cd <NEUER_PAKET_ORDNER>
   docker load -i __ARCHIVE_NAME__
   ```
3. Dienst mit neuer Compose-Datei neu starten:
   ```bash
   docker compose -f docker-compose.yml up -d
   ```
4. Nicht mehr benötigte alte Images entfernen:
   ```bash
   docker image prune -f
   ```

## Port-, Speicher- und Log-Limits (wo ändern)

- Port-Mapping: `deploy/pi/docker-compose.yml` unter `services.denkspiele.ports`.
- Speicherlimit: `deploy/pi/docker-compose.yml` unter `services.denkspiele.mem_limit`.
- Log-Limit: `deploy/pi/docker-compose.yml` unter `services.denkspiele.logging.options.max-size` und `max-file`.

## Was auf dem Mac geprüft wurde / nicht geprüft wurde

- Geprüft: `npm run typecheck`, `npm run build`.
- Nicht geprüft: Docker-Build, Archiv-Erzeugung, Container-Start und Healthcheck (Docker-Daemon auf dem Mac war nicht verfügbar).
