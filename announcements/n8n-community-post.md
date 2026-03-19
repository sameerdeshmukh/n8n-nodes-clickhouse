# n8n Community Forum Post

**Title:** ClickHouse Community Node - Full CRUD, Triggers, AI Agent Support & Security Hardened

---

Hey n8n community!

I'm excited to share **n8n-nodes-clickhouse-db** - a feature-complete ClickHouse integration that I've been building to make working with ClickHouse in n8n as seamless as possible.

## Why I Built This

While n8n's HTTP Request node can communicate with ClickHouse, I found myself repeatedly:
- Manually constructing URLs and auth headers
- Parsing JSON responses
- Handling errors inconsistently
- Missing out on ClickHouse-specific features

This node wraps all of that into a clean, purpose-built interface.

## What's Included

**10 Operations:**
- Execute Query (with parameterized queries!)
- Insert (batch support up to 100k rows)
- **NEW: Upsert** (auto-detects ReplacingMergeTree)
- Update Rows
- Delete Rows
- Create Table (auto-infer schema from input)
- List Tables / List Databases
- Get Table Info
- Execute Raw DDL/DML

**Trigger Node:**
- Poll for new rows or run custom queries
- Tracks cursor across workflow restarts

**AI Agent Ready:**
- `usableAsTool: true` - let LLMs query your ClickHouse data

**Security Hardened (v1.4.0):**
- SQL injection protection with strict validation
- 138 tests including 40+ penetration tests
- Control character and subquery blocking

## Installation

```
n8n-nodes-clickhouse-db
```

Go to **Settings → Community Nodes → Install** and paste the above.

## Links

- **npm:** https://www.npmjs.com/package/n8n-nodes-clickhouse-db
- **GitHub:** https://github.com/sameerdeshmukh/n8n-nodes-clickhouse
- **Changelog:** https://github.com/sameerdeshmukh/n8n-nodes-clickhouse/releases

## ClickHouse Cloud Support

Works great with ClickHouse Cloud - just set protocol to HTTPS and port to 8443. JWT Bearer auth is supported for SSO environments.

## Feedback Welcome!

I'd love to hear what features you'd find useful. Check out the [ROADMAP](https://github.com/sameerdeshmukh/n8n-nodes-clickhouse/blob/main/ROADMAP.md) for planned features including:
- Materialized View management
- Pagination support
- EXPLAIN mode
- AI agent schema descriptions

Thanks for checking it out!

---

**Tags:** community-node, database, clickhouse, analytics, olap
