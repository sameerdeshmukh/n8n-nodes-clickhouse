# Changelog

## [1.4.0] - 2026-03-19

### Security
- **SQL Injection Protection** — Added strict allowlist validation for WHERE clauses in DELETE and UPDATE operations
- **SET Expression Validation** — Validate and escape UPDATE column values to prevent injection
- **Control Character Blocking** — Reject null bytes and control characters in SQL expressions
- **Subquery Prevention** — Block nested SELECT statements in WHERE/SET clauses
- **Penetration Test Suite** — Added 40+ security-focused test cases

### Added
- **Upsert Operation** — Insert or update rows with automatic ReplacingMergeTree engine detection
- Query execution stats exposure via `_stats` field
- Query ID tracking via `_queryId` field
- ROADMAP.md with planned feature roadmap

### Changed
- DELETE operation now uses backtick-quoted table names for safety
- UPDATE operation auto-escapes string values and validates all column names
- Enhanced column mapping validation

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
