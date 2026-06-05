# Changelog

## [1.0.1] - 2026-06-05

### Changed

- Node categories updated to `Marketing`, `Productivity`, `Utility` (was `Development`)
- CI/publish workflows bumped to `actions/checkout@v5` and `actions/setup-node@v5` (Node 20 deprecation)

## [1.0.0] - 2026-06-05

First stable release. Same functionality as 0.1.0, promoted to a stable version
and published via GitHub Actions with npm provenance (OIDC trusted publishing).

## [0.1.0] - 2026-06-05

Initial release.

### Features

- **Feed** resource: Create, Update, Get by ID, List, Get Images, Get Permalinks, Download Files
- **Gallery** resource: List Gallery Assets
- **Wizard** resource: Get by ID, List
- OAuth2 authentication via the Streameye identity provider
- Automatic gzip/base64 decompression for compressed `schema` and `data` fields
- Feed data validation against the wizard schema before create/update, including asset-picker keyword resolution to gallery asset URLs
- html5-aware handling: Get Images and Get Permalinks skip html5 feeds with an n8n warning instead of failing the workflow
