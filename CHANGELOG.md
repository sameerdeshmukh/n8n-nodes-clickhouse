# Changelog

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
- npm provenance publishing via GitHub Actions (May 2026 requirement)
