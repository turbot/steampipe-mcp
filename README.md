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

- **Table Schemas** (`postgres://<host>/<table>/schema`)
  - JSON schema information for each table
  - Includes column names and data types
  - Automatically discovered from Steampipe database metadata

## Usage with Claude Desktop

To use this server with the Claude Desktop app, add the following configuration to the "mcpServers" section of your `claude_desktop_config.json`:

### NPX

```json
{
  "mcpServers": {
    "steampipe": {
      "command": "npx",
      "args": [
        "-y",
        "@turbot/steampipe-mcp",
        "postgres://localhost:9193/steampipe"
      ]
    }
  }
}
```

The default Steampipe database runs on port 9193. Adjust the connection string if you've configured Steampipe to use a different port or database name.

### Docker

When running docker on macOS, use `host.docker.internal` if the Steampipe service is running on the host network:

```json
{
  "mcpServers": {
    "steampipe": {
      "command": "docker",
      "args": [
        "run", 
        "-i", 
        "--rm", 
        "turbot/steampipe-mcp", 
        "postgres://host.docker.internal:9193/steampipe"]
    }
  }
}
```

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
node dist/index.js postgres://localhost:9193/steampipe
```

5. To use your local development version with Claude Desktop, update your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "steampipe": {
      "command": "node",
      "args": [
        "/path/to/your/workspace/dist/index.js",
        "postgres://localhost:9193/steampipe"
      ]
    }
  }
}
```

Replace `/path/to/your/workspace` with the absolute path to your local development directory. For example, if you cloned the repository to `~/src/steampipe-mcp`, you would use `~/src/steampipe-mcp/dist/index.js`.

## Building

Docker:

```sh
docker build -t turbot/steampipe-mcp . 
```

## License

This MCP server is licensed under the Apache License 2.0. For more details, please see the LICENSE file in the project repository.
