# Denkspiele (Pi-Paket)

## 1) Entwicklung auf dem Mac

1. Voraussetzungen: Node.js 22 LTS und npm.
2. Abhängigkeiten installieren:
   ```bash
   npm ci
   ```
3. Entwicklungsserver starten:
   ```bash
   npm run dev
   ```

## 2) Lokalen Build prüfen

1. Typprüfung:
   ```bash
   npm run typecheck
   ```
2. Produktions-Build:
   ```bash
   npm run build
   ```

## 3) Pi-Paket erzeugen

1. Docker-Daemon starten.
2. Paket erstellen:
   ```bash
   ./scripts/pi-paket.sh
   ```
3. Ergebnis liegt in `pi-paket/` mit genau drei Dateien:
   - Image-Archiv (`*.tar.gz`)
   - `docker-compose.yml`
   - `UEBERGABE.md`

## 4) Paket auf den Pi kopieren

```bash
scp -r pi-paket/ <PI_BENUTZER>@<PI_ADRESSE>:/home/<PI_BENUTZER>/denkspiele/
```

Die Inbetriebnahme auf dem Pi erfolgt ausschließlich über `pi-paket/UEBERGABE.md`.
