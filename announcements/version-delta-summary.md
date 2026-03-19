# n8n-nodes-clickhouse-db: What's New Since v1.0.0

## From 3 Operations to 10 — Full CRUD & Beyond

**v1.0.0** started with basic query, insert, and raw DDL support.

**v1.4.0** is now a complete ClickHouse toolkit:

| Category | Added |
|----------|-------|
| **CRUD** | Update Rows, Delete Rows, Upsert |
| **Schema** | Create Table, List Tables, List Databases, Get Table Info |
| **Triggers** | Polling trigger (New Rows + Custom Query modes) |
| **Auth** | JWT Bearer token for Cloud/SSO |
| **Security** | SQL injection protection, 40+ penetration tests |

## Key Highlights

### Upsert with Auto-Detection
Automatically detects ReplacingMergeTree and uses optimal deduplication strategy.

### Event-Driven Workflows
Trigger node polls for new rows and tracks cursor across restarts.

### Security Hardened
Strict WHERE/SET validation blocks SQL injection, subqueries, and control characters.

### Dynamic UI
Database and table dropdowns populated from live ClickHouse connection.

## By the Numbers

| | v1.0.0 | v1.4.0 |
|---|--------|--------|
| Operations | 3 | 10 |
| Triggers | 0 | 1 |
| Tests | ~10 | 138 |
| Security tests | 0 | 40+ |

---

## Version History

### v1.0.0 (Initial Release)
**Operations:** 3
- Execute Query (parameterized)
- Insert (batch chunking)
- Execute Raw (DDL/DML)

**Features:**
- ClickHouse Cloud support
- AI Agent tool (`usableAsTool: true`)
- Credential connectivity test
- Settings passthrough
- `continueOnFail` support

### v1.1.0
**Added:**
- JWT Bearer token authentication (Cloud/SSO)

### v1.3.0
**New Operations:**
- Update Rows
- Delete Rows
- Create Table (manual + auto-infer)
- Get Table Info
- List Tables
- List Databases

**New Node:**
- ClickHouse Trigger (polling: New Rows + Custom Query)

**Features:**
- Dynamic database/table dropdowns
- Helper utilities
- 65 tests

### v1.4.0
**New Operations:**
- Upsert (ReplacingMergeTree auto-detect)

**Security:**
- WHERE clause SQL injection protection
- SET expression validation
- Control character blocking
- Subquery prevention
- 138 tests (40+ penetration tests)

**Features:**
- Query stats exposure (`_stats`)
- Query ID tracking (`_queryId`)
- ROADMAP.md

---

**Install:** `n8n-nodes-clickhouse-db`
**npm:** https://www.npmjs.com/package/n8n-nodes-clickhouse-db
**GitHub:** https://github.com/sameerdeshmukh/n8n-nodes-clickhouse
