# n8n-nodes-clickhouse

[![npm version](https://img.shields.io/npm/v/n8n-nodes-clickhouse-db.svg)](https://www.npmjs.com/package/n8n-nodes-clickhouse-db)
[![npm downloads](https://img.shields.io/npm/dm/n8n-nodes-clickhouse-db.svg)](https://www.npmjs.com/package/n8n-nodes-clickhouse-db)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-138%20passed-brightgreen.svg)](https://github.com/sameerdeshmukh/n8n-nodes-clickhouse)
[![Security](https://img.shields.io/badge/security-hardened-blue.svg)](https://github.com/sameerdeshmukh/n8n-nodes-clickhouse)

**The most feature-complete ClickHouse integration for n8n** — full CRUD, schema management, upserts, polling triggers, and AI agent tool support for ClickHouse and ClickHouse Cloud.

> **New in v1.4.0**: SQL injection protection, Upsert operation with ReplacingMergeTree auto-detection, and 138 security-focused tests.

## Why This Node

While n8n's built-in HTTP Request node can communicate with ClickHouse's HTTP interface, it requires manual URL construction, auth headers, response parsing, and error handling for every request. This node wraps all of that into a clean, purpose-built interface with parameterized queries, batch inserts, full CRUD operations, schema introspection, polling triggers, and full ClickHouse Cloud support — so you can focus on your data, not boilerplate.

## Features at a Glance

- **10 operations** — query, insert, upsert, update, delete, create table, list tables, list databases, get table info, execute raw DDL/DML
- **Upsert with auto-detection** — automatically detects ReplacingMergeTree and uses optimal strategy
- **Polling trigger node** — fires on new rows or custom query results, with configurable interval
- **AI Agent ready** — `usableAsTool: true` lets LLMs query ClickHouse via natural language
- **Security hardened** — SQL injection protection with strict validation (138 tests)
- **Parameterized queries** — native `{param:Type}` syntax, zero SQL injection risk
- **Batch inserts** — configurable chunk size (default 1,000 rows)
- **Schema-aware table creation** — auto-infer columns from input data or define manually
- **JWT Bearer auth** — alternative auth for ClickHouse Cloud / SSO environments
- **Zero runtime dependencies** — compatible with n8n Cloud verified node program
- **ClickHouse Cloud native** — HTTPS, port 8443, tested on ClickHouse 22.x–26.x

## Installation

### Self-hosted n8n

Go to **Settings → Community Nodes → Install** and enter:

```
n8n-nodes-clickhouse-db
```

### Manual / Docker

```bash
npm install n8n-nodes-clickhouse-db
```

## Operations

| Operation | Description |
|-----------|-------------|
| **Execute Query** | Run a SELECT query with optional parameterized values and return rows as n8n items |
| **Insert** | Insert input items into a ClickHouse table using JSONEachRow format with configurable batch size |
| **Upsert** | Insert or update rows — auto-detects ReplacingMergeTree for efficient deduplication |
| **Update Rows** | Update rows matching a WHERE clause using ALTER TABLE … UPDATE |
| **Delete Rows** | Delete rows matching a WHERE clause using ALTER TABLE … DELETE |
| **Create Table** | Create a new table — define columns manually or auto-infer schema from input data |
| **Get Table Info** | Return schema, engine, row count, and disk size for a table |
| **List Tables** | List all tables in a database |
| **List Databases** | List all databases on the server |
| **Execute Raw** | Execute arbitrary DDL/DML — ALTER, DROP, TRUNCATE, OPTIMIZE, etc. |

## Trigger Node

The **ClickHouse Trigger** node polls for new or changed data on a configurable interval:

| Mode | Description |
|------|-------------|
| **New Rows** | Detects new rows by tracking a monotonically increasing column (auto-increment ID, DateTime, etc.) |
| **Custom Query** | Runs any SELECT and triggers when new results appear |

The trigger stores its cursor in n8n workflow static data, so it resumes correctly across restarts.

## Credentials Setup

Create a new **ClickHouse API** credential with the following fields:

| Field | Default | Description |
|-------|---------|-------------|
| Host | `localhost` | ClickHouse server hostname (no protocol or port) |
| Port | `8123` | HTTP port (`8123` for HTTP, `8443` for HTTPS / ClickHouse Cloud) |
| Database | `default` | Default database |
| Username | `default` | ClickHouse username |
| Password | *(empty)* | ClickHouse password |
| Protocol | `http` | `http` or `https` (use `https` for ClickHouse Cloud) |
| Auth Method | `Basic Auth` | Choose **Basic Auth** (username/password) or **JWT Bearer Token** for Cloud/SSO |

The credential includes a built-in connectivity test that runs `SELECT 1` to verify the connection.

## Usage Examples

### Parameterized SELECT

Use `{name:Type}` placeholders in your SQL for safe, parameterized queries:

**Query:**
```sql
SELECT * FROM events WHERE user_id = {user_id:UInt64} AND event_date >= {start_date:Date}
```

**Query Parameters:**
- `user_id` → `12345`
- `start_date` → `2026-01-01`

Parameters are passed as URL query params (`param_user_id=12345`), which ClickHouse handles natively — no string concatenation, no SQL injection risk.

### Insert from Webhook

1. Add a **Webhook** trigger node
2. Connect it to the **ClickHouse** node
3. Set operation to **Insert**
4. Set the table name (e.g., `webhook_events`)

All fields from the incoming webhook JSON body are inserted as columns. The node sends data in batches (default: 1,000 rows per request).

### Update Rows

```
Operation: Update Rows
Table:     users
SET:       status = 'inactive'
WHERE:     last_login < '2025-01-01'
```

### Create Table with Schema Inference

Connect any node that outputs JSON items → set operation to **Create Table** → enable **Infer Schema from Input**. The node maps JSON types to ClickHouse types and creates the table automatically.

### Polling Trigger — New Orders

1. Add a **ClickHouse Trigger** node
2. Set mode to **New Rows**
3. Table: `orders`, Tracking Column: `order_id`
4. Set poll interval (e.g., every 1 minute)

The trigger remembers the last `order_id` it saw and only returns newer rows on each poll.

## AI Agent Tool Usage

This node has `usableAsTool: true`, which means it can be wired as a tool in n8n's **AI Agent** node. This allows LLMs to query ClickHouse dynamically:

1. Add an **AI Agent** node to your workflow
2. In the Agent's **Tools** section, add the **ClickHouse** node
3. Configure the ClickHouse credentials
4. The AI agent can now generate and execute ClickHouse queries based on natural language prompts

This is useful for building conversational analytics interfaces where users can ask questions about their data in plain English.

## ClickHouse Cloud

For ClickHouse Cloud instances:

- Set **Protocol** to `https`
- Set **Port** to `8443`
- Set **Host** to your Cloud hostname (from the ClickHouse Cloud console)
- Optionally use **JWT Bearer Token** auth for SSO environments
- Compatible with ClickHouse 22.x–26.x and the Cloud service

## ClickHouse Settings

You can pass [ClickHouse settings](https://clickhouse.com/docs/en/operations/settings/settings) as a JSON string in the **Query Settings** option field:

```json
{"max_execution_time": 30, "max_rows_to_read": 1000000}
```

These are appended as URL query parameters to the ClickHouse HTTP request.

## Compatibility

- **n8n**: >= 1.94.0 (verified node support)
- **Node.js**: >= 20
- **ClickHouse**: >= 22.x (tested up to 26.1)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local development setup, PR guidelines, and the zero-runtime-dependencies requirement.

## License

[MIT](LICENSE)
