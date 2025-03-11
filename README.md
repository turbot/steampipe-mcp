# Steampipe Model Context Protocol (MCP) Server

A Model Context Protocol server that provides read-only access to Steampipe databases. This server enables LLMs to inspect database schemas and execute read-only queries against your Steampipe installation.

## Components

### Tools

- **query**
  - Execute read-only SQL queries against the connected Steampipe database
  - Input: `sql` (string): The SQL query to execute
  - All queries are executed within a READ ONLY transaction

### Resources

The server provides schema information for each table in the Steampipe database:

- **Table Schemas** (`postgresql://<user>@<host>/<table>/schema`)
  - JSON schema information for each table
  - Includes column names and data types
  - Automatically discovered from Steampipe database metadata

## Installation

```sh
npm install -g @turbot/steampipe-mcp
```

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

1. Install dependencies:
```sh
npm install
```

2. Build the project:
```sh
npm run build
```

3. For development with auto-recompilation:
```sh
npm run watch
```

4. To test locally, ensure Steampipe is running and then:
```sh
node dist/index.js postgresql://steampipe@localhost:9193/steampipe
```

5. To use your local development version with Claude Desktop, update your `claude_desktop_config.json`:
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

## Using with MCP Inspector

The MCP Inspector is helpful for testing and debugging. Install it globally and use it in proxy mode to test the MCP server directly:

```sh
npm install -g @modelcontextprotocol/inspector
mcp-inspector-proxy npx @turbot/steampipe-mcp postgresql://steampipe@localhost:9193/steampipe
```

For local development testing:
```sh
mcp-inspector-proxy node dist/index.js postgresql://steampipe@localhost:9193/steampipe
```

## License

This MCP server is licensed under the Apache License 2.0. For more details, please see the LICENSE file in the project repository.
