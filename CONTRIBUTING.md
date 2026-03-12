# Contributing to n8n-nodes-clickhouse

Thank you for your interest in contributing! This guide will help you get started.

## Local Development Setup

### Prerequisites

- Node.js >= 20
- npm >= 9
- n8n installed globally or locally for testing

### Getting Started

1. Clone the repository:

```bash
git clone https://github.com/your-org/n8n-nodes-clickhouse.git
cd n8n-nodes-clickhouse
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

### Testing with n8n

#### Option 1: npm link

```bash
# In this project directory
npm link

# In your n8n installation directory
npm link n8n-nodes-clickhouse
```

Then restart n8n. The ClickHouse node should appear in the nodes panel.

#### Option 2: N8N_CUSTOM_EXTENSIONS

Set the `N8N_CUSTOM_EXTENSIONS` environment variable to point to this project's directory:

```bash
export N8N_CUSTOM_EXTENSIONS="/path/to/n8n-nodes-clickhouse"
n8n start
```

#### Option 3: Custom nodes path

Copy or symlink the built package to n8n's custom nodes directory:

```bash
# Default path: ~/.n8n/custom
mkdir -p ~/.n8n/custom
ln -s /path/to/n8n-nodes-clickhouse ~/.n8n/custom/n8n-nodes-clickhouse
```

## Code Style

This project uses ESLint and Prettier for code formatting:

```bash
# Check linting
npm run lint

# Auto-fix lint issues
npm run lintfix

# Format code
npm run format
```

## Important: No Runtime Dependencies

This package is designed to be verified for n8n Cloud. Verified community nodes
**cannot have any runtime npm dependencies**. All ClickHouse communication uses
n8n's built-in `this.helpers.httpRequest()` method.

- Do NOT add packages to `dependencies` in `package.json`
- Only add packages to `devDependencies` if needed for build/lint/test
- The helper module (`ClickHouse.helpers.ts`) must use only Node.js built-ins

## Pull Request Guidelines

1. Fork the repository and create a feature branch
2. Make your changes following the existing code patterns
3. Ensure `npm run build` and `npm run lint` pass with zero errors
4. Write clear commit messages describing what changed and why
5. Open a pull request with a description of the changes

## Reporting Issues

Please use GitHub Issues to report bugs or request features. Include:

- n8n version
- Node.js version
- ClickHouse version
- Steps to reproduce the issue
- Expected vs actual behavior

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
