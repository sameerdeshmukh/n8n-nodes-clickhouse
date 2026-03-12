# n8n-nodes-clickhouse

[![npm version](https://img.shields.io/npm/v/n8n-nodes-clickhouse.svg)](https://www.npmjs.com/package/n8n-nodes-clickhouse)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

n8n community node for [ClickHouse](https://clickhouse.com/) — query, insert, and manage your ClickHouse databases directly from n8n workflows and AI agents.

## Why This Node

While n8n's built-in HTTP Request node can communicate with ClickHouse's HTTP interface, it requires manual URL construction, auth headers, response parsing, and error handling for every request. This node wraps all of that into a clean, purpose-built interface with parameterized queries, batch inserts, and full ClickHouse Cloud support — so you can focus on your data, not boilerplate.

## Installation

### Self-hosted n8n

Go to **Settings → Community Nodes → Install** and enter:

```
n8n-nodes-clickhouse
```

### n8n Cloud

Search for **ClickHouse** in the nodes panel. As a verified node, no manual installation is needed.

### Manual

```bash
npm install n8n-nodes-clickhouse
```

## Operations

| Operation | Description |
|-----------|-------------|
| **Execute Query** | Run a SELECT query with optional parameterized values and return rows as n8n items |
| **Insert** | Insert n8n input items into a ClickHouse table using JSONEachRow format with configurable batch size |
| **Execute Raw** | Execute DDL/DML statements — CREATE TABLE, ALTER, DROP, TRUNCATE, OPTIMIZE, etc. |

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

All fields from the incoming webhook JSON body are inserted as columns. The node sends data in batches (default: 1000 rows per request).

### CREATE TABLE with Execute Raw

Set operation to **Execute Raw** and enter:

```sql
CREATE TABLE IF NOT EXISTS events (
    event_id UInt64,
    user_id UInt64,
    event_type String,
    event_date Date,
    payload String
) ENGINE = MergeTree()
ORDER BY (event_date, event_id)
```

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
- Compatible with ClickHouse 26.x and the Cloud service

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
