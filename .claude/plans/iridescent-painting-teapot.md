# Plan: Rewrite README.md

## Context
The current README.md is outdated — it has TODO placeholders, doesn't mention the web UI, Docker support, or how to actually run the service. The project has evolved significantly: it now includes a full Express.js web interface, Docker deployment, a Fast Download API, and multiple download sources. The README needs to reflect all of this.

## File to Modify
- `README.md` (full rewrite)

## Proposed Structure

### 1. Title & Description
- Project name: **AnnaCheckout**
- One-line description: unofficial JS client + web UI for Anna's Archive
- Mention dual usage: importable npm module AND standalone web service

### 2. Features
- Bullet list: search, download (IPFS/LibGen), Fast Download API, web UI, Docker support

### 3. Quick Start (Web UI)
- Prerequisites (Node.js 20+, npm)
- Clone, install, configure `.env`, run `npm start`, visit localhost:3000
- Docker alternative: `docker-compose up --build`

### 4. Configuration
- `SECRET_KEY` — what it does, how to get it
- `DOWNLOAD_PATH` — default and override
- `PORT` — default 3000
- Reference `src/config/.env`

### 5. Web UI
- Screenshots placeholder / description of pages
- Routes: Search (`/search`), Settings (`/settings`), Download status
- Search filters: language, content type, file extension, sort

### 6. Usage as npm Module
- Installation (npm install)
- Code examples: search, fetchByMd5, downloadByMd5
- Method signatures table
- Response format examples (search result, content detail)

### 7. Docker Deployment
- `docker-compose up --build`
- Explain volume mounts (downloads, settings.json)
- Explain env_file for SECRET_KEY

### 8. Development
- `npm install` (with devDependencies)
- `npm test` (Mocha + NYC, 90% coverage)
- `npm run lint` (ESLint Google style)
- Project structure tree

### 9. Architecture
- Concise diagram showing scraping vs Fast Download API paths
- Download source priority

### 10. Contributing & License
- Keep existing contributing section
- MIT license

## Verification
- Read the rendered README on GitHub or locally to confirm formatting
- Ensure all code examples are accurate against actual method signatures
- Verify Docker commands work as documented
