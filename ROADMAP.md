# n8n-nodes-clickhouse Roadmap

## Completed

### v1.0.0 - Initial Release
- [x] Execute Query with parameterized queries (`{param:Type}` syntax)
- [x] Insert operation with batch chunking (1-100,000 rows)
- [x] Execute Raw operation for DDL/DML
- [x] ClickHouse Cloud support (HTTPS, port 8443)
- [x] AI Agent tool compatibility (`usableAsTool: true`)
- [x] Credential connectivity test
- [x] ClickHouse settings passthrough
- [x] `continueOnFail` support

### v1.1.0 - Authentication
- [x] JWT Bearer token authentication for Cloud/SSO

### v1.3.0 - Full CRUD & Triggers
- [x] Update Rows operation (ALTER TABLE ... UPDATE)
- [x] Delete Rows operation (ALTER TABLE ... DELETE)
- [x] Create Table operation (manual + auto-infer schema)
- [x] Get Table Info operation
- [x] List Tables operation
- [x] List Databases operation
- [x] ClickHouse Trigger node (polling: New Rows + Custom Query)
- [x] Dynamic database/table dropdowns
- [x] Helper utilities (sanitizeIdentifier, buildUrl, mapJsonTypeToCH)
- [x] Comprehensive test suite (65 tests)

---

## Planned

### v1.4.0 - Security Hardening + Core (Current)
- [ ] SQL injection hardening (WHERE/SET validation with strict allowlist)
- [ ] Upsert / ReplacingMergeTree support (auto-detect engine)
- [ ] Enhanced column mapping UI on Insert
- [ ] Query execution stats exposure
- [ ] Query ID tracking
- [ ] Penetration test coverage

### v1.5.0 - Schema Intelligence + Query Features
- [ ] Dynamic column schema loading (query system.columns)
- [ ] Pagination support (LIMIT/OFFSET cursor-based)
- [ ] Dry-run / EXPLAIN mode
- [ ] Error classification (structured error types)
- [ ] Batch operations with async_insert

### v1.6.0 - Power Features + AI Enhancements
- [ ] Materialized View management
- [ ] Mutations monitoring (system.mutations)
- [ ] Smart schema description for AI agents
- [ ] Execution logging
- [ ] Part & partition management

---

## Future Considerations

### Integration & Connectivity
- [ ] Connection pooling & keep-alive
- [ ] Multiple credential profiles (read/write split)
- [ ] ClickHouse Cloud-specific features
- [ ] Proxy / SSH tunnel support
- [ ] Custom CA / mTLS certificates

### Advanced Features
- [ ] Dictionary operations (dictGet)
- [ ] Cluster-aware operations (ON CLUSTER)
- [ ] Streaming large results
- [ ] Query templates / saved queries
- [ ] Multiple result sets

### AI Agent Enhancements
- [ ] Natural language to SQL
- [ ] Query result summarization
- [ ] Anomaly detection trigger

### Real-time
- [ ] Webhook-based CDC
- [ ] Watch query (LIVE VIEW)
