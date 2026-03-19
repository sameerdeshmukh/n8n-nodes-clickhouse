# ClickHouse Community Post (Slack / GitHub Discussions)

**Title:** n8n Integration for ClickHouse - Full CRUD, Triggers & AI Agent Support

---

Hi ClickHouse community!

I wanted to share a project I've been working on: **n8n-nodes-clickhouse-db** - a comprehensive ClickHouse integration for the [n8n](https://n8n.io) workflow automation platform.

## What is n8n?

n8n is an open-source workflow automation tool (like Zapier but self-hostable). It lets you connect APIs, databases, and services with a visual workflow builder.

## Why This Matters for ClickHouse Users

This integration lets you:

1. **Automate data pipelines** - Pull data from any API and insert into ClickHouse
2. **Build real-time dashboards** - Query ClickHouse and push results to Slack, email, etc.
3. **Event-driven workflows** - Trigger workflows when new data arrives in ClickHouse
4. **AI-powered analytics** - Let LLMs query your ClickHouse data via natural language

## Features

**Full CRUD + Schema Operations:**
- Parameterized queries (`{param:Type}` syntax)
- Batch inserts (up to 100k rows per batch)
- Upsert with ReplacingMergeTree auto-detection
- Update/Delete with WHERE clauses
- Create tables with schema inference
- List databases/tables, get table info

**ClickHouse Cloud Native:**
- HTTPS + port 8443 support
- JWT Bearer token auth for SSO
- Tested on ClickHouse 22.x - 26.x

**Polling Trigger:**
- Monitor tables for new rows
- Track cursor via monotonically increasing columns
- Custom query mode for complex triggers

**Security Hardened:**
- SQL injection protection with strict validation
- 138 tests including penetration test suite
- Settings allowlist (53 approved settings)

## Example Use Cases

1. **Webhook → ClickHouse**: Receive webhooks and insert events directly
2. **ClickHouse → Slack**: Alert when metrics exceed thresholds
3. **API → Transform → ClickHouse**: ETL from REST APIs
4. **AI Agent**: "Show me the top 10 customers by revenue last month"

## Installation

If you use n8n, install via:
```
Settings → Community Nodes → Install → n8n-nodes-clickhouse-db
```

## Links

- **npm:** https://www.npmjs.com/package/n8n-nodes-clickhouse-db
- **GitHub:** https://github.com/sameerdeshmukh/n8n-nodes-clickhouse
- **n8n:** https://n8n.io

## Roadmap

Planning to add:
- Materialized View management
- Mutations monitoring
- Part & partition management
- Dynamic column schema loading

Would love feedback from the ClickHouse community on what features would be most useful!

---

#clickhouse #n8n #automation #etl #analytics
