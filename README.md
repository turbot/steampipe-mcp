# Steampipe Model Context Protocol (MCP) Server

Enable AI assistants like Claude to explore and query your Steampipe data! This Model Context Protocol (MCP) server lets AI tools:

- Browse your Steampipe schemas and tables
- Understand your data structure and relationships
- Run read-only SQL queries against your data
- Provide insights and analysis based on your infrastructure data

Perfect for:
- Getting AI help analyzing your cloud infrastructure
- Letting AI explore your compliance and security data
- Having AI assist with Steampipe query development
- Enabling natural language interactions with your Steampipe data

Connects directly to your local Steampipe installation or your Turbot Pipes workspace, giving you AI access to all your cloud and SaaS data.

## Components

### Tools

- **query**
  - Execute read-only SQL queries against the connected Steampipe database
  - Input: `sql` (string): The SQL query to execute
  - All queries are executed within a READ ONLY transaction

- **clear_cache**
  - Clear any cached database information
  - No input parameters required

- **inspect_database**
  - List all schemas in the database
  - Optional input: `filter` (string): Filter schemas by name pattern

- **inspect_schema**
  - List all tables in a schema
  - Input: `name` (string): The schema name to inspect
  - Optional input: `filter` (string): Filter tables by name pattern

- **inspect_table**
  - Get detailed information about a table including its columns
  - Input: `name` (string): The name of the table to inspect
  - Optional input: `schema` (string): The schema containing the table

## Usage with Claude Desktop

To use this server with the Claude Desktop app, add the following configuration to the "mcpServers" section of your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "steampipe": {
      "command": "npx",
      "args": [
        "-y",
        "@turbot/steampipe-mcp",
        "postgresql://steampipe@localhost:9193/steampipe"
      ]
    }
  }
}
```

The default Steampipe database runs on port 9193 with username 'steampipe'. Adjust the connection string if you've configured Steampipe to use different settings.

## Local Development

To set up the project for local development:

1. Clone the repository and navigate to the directory:
```sh
git clone https://github.com/turbot/steampipe-mcp.git
cd steampipe-mcp
```

2. Install dependencies:
```sh
npm install
```

3. Build the project:
```sh
npm run build
```

4. For development with auto-recompilation:
```sh
npm run watch
```

5. To test locally, ensure Steampipe is running and then:
```sh
node dist/index.js postgresql://steampipe@localhost:9193/steampipe
```

6. To use your local development version with Claude Desktop, update your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "steampipe": {
      "command": "node",
      "args": [
        "/path/to/your/workspace/dist/index.js",
        "postgresql://steampipe@localhost:9193/steampipe"
      ]
    }
  }
}
```

Replace `/path/to/your/workspace` with the absolute path to your local development directory. For example, if you cloned the repository to `~/src/steampipe-mcp`, you would use `~/src/steampipe-mcp/dist/index.js`.

## Testing with MCP Inspector

The MCP Inspector is helpful for testing and debugging. To test your local development version:

```sh
npx @modelcontextprotocol/inspector dist/index.js
```

## Open Source & Contributing

This repository is published under the [Apache 2.0 license](https://www.apache.org/licenses/LICENSE-2.0). Please see our [code of conduct](https://github.com/turbot/.github/blob/main/CODE_OF_CONDUCT.md). We look forward to collaborating with you!

[Steampipe](https://steampipe.io) is a product produced from this open source software, exclusively by [Turbot HQ, Inc](https://turbot.com). It is distributed under our commercial terms. Others are allowed to make their own distribution of the software, but cannot use any of the Turbot trademarks, cloud services, etc. You can learn more in our [Open Source FAQ](https://turbot.com/open-source).

## Get Involved

**[Join #steampipe on Slack →](https://turbot.com/community/join)**

Want to help but don't know where to start? Pick up one of the `help wanted` issues:
- [Steampipe](https://github.com/turbot/steampipe/labels/help%20wanted)
- [MCP Server](https://github.com/turbot/steampipe-mcp/labels/help%20wanted)