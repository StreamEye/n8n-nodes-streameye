# Changelog

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
