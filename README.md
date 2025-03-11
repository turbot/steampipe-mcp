# Steampipe Model Context Protocol (MCP) Server

A Model Context Protocol server that provides read-only access to Steampipe databases. This server enables LLMs to inspect database schemas and execute read-only queries against your Steampipe installation.

## Components

### Tools

- **query**
  - Execute read-only SQL queries against the connected Steampipe database
  - Input: `sql` (string): The SQL query to execute
  - All queries are executed within a READ ONLY transaction

- **clearCache**
  - Clear any cached database information
  - No input parameters required

- **inspectSchemas**
  - List all available schemas in the database
  - Optional input: `filter` (string): Filter schemas by name pattern

- **inspectTables**
  - List all tables in a specific schema
  - Input: `schema` (string): The schema to inspect
  - Optional input: `filter` (string): Filter tables by name pattern

- **inspectColumns**
  - List all columns in a specific table
  - Input: `table` (string): The table to inspect
  - Optional input: `schema` (string): The schema containing the table
  - Optional input: `filter` (string): Filter columns by name pattern

### Resources

The server provides schema and table information from the Steampipe database:

- **Schema** (`postgresql://schema/{name}`)
  - Get information about a database schema including its tables
  - Parameter: `name` - The name of the schema to query

- **Table** (`postgresql://table/{schema}/{name}`)
  - Get information about a table including its column definitions
  - Parameters:
    - `schema` - The schema containing the table
    - `name` - The name of the table to query

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
