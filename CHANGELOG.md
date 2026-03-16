# Changelog

## [1.3.0] - 2026-03-16

### Added
- Update Rows operation — ALTER TABLE … UPDATE with WHERE clause
- Delete Rows operation — ALTER TABLE … DELETE with WHERE clause
- Create Table operation — manual column definition or auto-infer schema from input data
- Get Table Info operation — returns schema, engine, row count, and disk size
- List Tables operation — list all tables in a database
- List Databases operation — list all databases on the server
- ClickHouse Trigger node — polling trigger with New Rows and Custom Query modes
- Dynamic database/table dropdowns populated from live ClickHouse connection
- Shared helper utilities (sanitizeIdentifier, buildUrl, mapJsonTypeToCH)
- Comprehensive test suite (65 tests)

## [1.1.0] - 2026-03-15

### Added
- JWT Bearer token authentication as alternative auth method for ClickHouse Cloud/SSO environments
- Added .env and .npmrc to .gitignore to prevent accidental secret commits

## [1.0.0] - 2026-03-12

### Added
- Execute Query operation with parameterized query support (`{param:Type}` syntax)
- Insert operation with configurable batch chunk size (default 1000 rows)
- Execute Raw operation for DDL/DML (CREATE, ALTER, DROP, TRUNCATE, OPTIMIZE)
- ClickHouse Cloud support (HTTPS, port 8443)
- AI Agent tool compatibility (`usableAsTool: true`)
- Credential connectivity test (SELECT 1 health check)
- ClickHouse settings passthrough via JSON options field
- continueOnFail support on all operations
- Zero runtime npm dependencies — compatible with n8n Cloud verified node program
- npm provenance publishing via GitHub Actions
