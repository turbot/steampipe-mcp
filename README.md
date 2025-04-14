# Tailpipe Model Context Protocol (MCP) Server

Enable AI assistants like Claude to explore and query your Tailpipe data! This Model Context Protocol (MCP) server lets AI tools:

- Browse your Tailpipe schemas and tables
- Understand your data structure and relationships
- Run SQL queries against your data
- Provide insights and analysis based on your cloud and SaaS data

Perfect for:
- Getting AI help analyzing your cloud infrastructure
- Having AI assist with Tailpipe query development
- Enabling natural language interactions with your Tailpipe data
- Exploring and analyzing your data with AI assistance

Connects directly to your local Tailpipe database file, giving you AI access to all your cloud and SaaS data.

## Components

### Prompts

The Tailpipe MCP includes a built-in prompt to help you work effectively with the data:

- **best_practices**
  - Best practices for working with Tailpipe data
  - Provides guidance on:
    - Using tools to explore available data (partition_list, table_list, etc.)
    - SQL syntax and style conventions
    - Data freshness and connection management
    - Example workflow and queries

You can load this prompt in Claude Desktop through the plug icon in the prompt window. The prompt will teach Claude how to:
- Use the appropriate tools to explore and understand your data
- Write efficient SQL queries using DuckDB syntax
- Follow consistent formatting and style conventions
- Work with data timestamps and freshness

### Tools

Database Operations:
- **query_tailpipe**
  - Run a read-only Tailpipe SQL query
  - Input: `sql` (string): The SQL query to execute
  
- **reconnect_tailpipe**
  - Reconnect to the database, optionally using a new database path
  - Optional input: `database_path` (string): New database path to connect to

Data Structure Operations:
- **partition_list**
  - List all available Tailpipe partitions
  - No input parameters required

- **partition_show**
  - Show details of a specific Tailpipe partition
  - Input: `name` (string): Name of the partition to show details for

- **table_list**
  - List all available Tailpipe tables
  - No input parameters required

- **table_show**
  - Show details of a specific Tailpipe table
  - Input: `name` (string): Name of the table to show details for

Plugin Operations:
- **plugin_list**
  - List all available Tailpipe plugins
  - No input parameters required

- **plugin_show**
  - Show details of a specific Tailpipe plugin
  - Input: `name` (string): Name of the plugin to show details for

Source Operations:
- **source_list**
  - List all available Tailpipe sources
  - No input parameters required

- **source_show**
  - Show details of a specific Tailpipe source
  - Input: `name` (string): Name of the source to show details for

### Resource Types

The Tailpipe MCP provides access to several types of resources:

- **Partitions**
  - Represents a data partition in Tailpipe
  - Properties include name, description, file count, file size, and associated plugin
  
- **Tables**
  - Represents a Tailpipe table
  - Properties include name, description, file count, file size, and associated plugin

- **Plugins**
  - Represents a Tailpipe plugin
  - Properties include name, version, and associated partitions

- **Sources**
  - Represents a Tailpipe data source
  - Properties include name, description, and associated plugin

Resource templates enable structured access to Tailpipe metadata, making it easier for AI tools to understand and navigate your data.

## Installation

### Claude Desktop

[How to use MCP servers with Claude Desktop →](https://modelcontextprotocol.io/quickstart/user)

Add the following configuration to the "mcpServers" section of your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tailpipe": {
      "command": "npx",
      "args": [
        "-y",
        "github:turbot/tailpipe-mcp"
      ]
    }
  }
}
```

This will automatically use the Tailpipe CLI to discover your database. If you want to specify a database file path explicitly, you can add it as an additional argument:

```json
{
  "mcpServers": {
    "tailpipe": {
      "command": "npx",
      "args": [
        "-y",
        "github:turbot/tailpipe-mcp",
        "/path/to/your/tailpipe.db"
      ]
    }
  }
}
```

### Cursor

To install the Tailpipe MCP server in Cursor:

1. Open your Cursor MCP configuration file:
   ```sh
   open ~/.cursor/mcp.json  # On macOS
   # or
   code ~/.cursor/mcp.json  # Using VS Code
   ```

2. Add the following configuration to enable automatic database discovery using the Tailpipe CLI:
   ```json
   {
     "mcpServers": {
       "tailpipe": {
         "name": "Tailpipe",
         "description": "Query Tailpipe data",
         "server": "github:turbot/tailpipe-mcp"
       }
     }
   }
   ```

   Alternatively, if you want to specify a database path explicitly:
   ```json
   {
     "mcpServers": {
       "tailpipe": {
         "name": "Tailpipe",
         "description": "Query Tailpipe data",
         "server": "github:turbot/tailpipe-mcp",
         "args": ["/path/to/your/tailpipe.db"]
       }
     }
   }
   ```

3. Save the configuration file and restart Cursor for the changes to take effect.

4. The Tailpipe MCP server will now be available in your Cursor environment.

## Prompting Guide

### Best Practices

The Tailpipe MCP includes a pre-built `best_practices` prompt. Running it before running your own prompts will teach the LLM how to work most effectively with Tailpipe, including:

- How to explore available data schemas and tables
- When to use specific tables for different resource types
- How to write efficient queries that follow Tailpipe conventions
- Best practices for formatting and presenting results

In Claude Desktop, you can load this prompt through the plug icon in the prompt window.

### Example Prompts

Each prompt below is designed to work with Tailpipe's table structure, where each resource type (buckets, instances, etc.) has its own table.

```
List all tables in the aws schema
```

```
What columns are in the aws_s3_bucket table?
```

```
Find S3 buckets that don't have encryption enabled
```

```
What EC2 instances have public IPs and are in a public subnet?
```

Remember to:
- Ask about specific resource types (e.g., EC2 instances, S3 buckets, IAM users)
- Be clear about which services or schemas you're interested in
- Start with simple questions about one resource type
- Add more complexity or conditions after seeing the initial results

Claude will:
- Choose the appropriate Tailpipe tables for your request
- Write efficient SQL queries behind the scenes
- Format the results in a clear, readable way
- Provide insights and analysis based on your data

## Local Development

To set up the project for local development:

1. Clone the repository and navigate to the directory:
```sh
git clone https://github.com/turbot/tailpipe-mcp.git
cd tailpipe-mcp
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

5. To test locally:
```sh
# Run the main test (conversation with query testing)
npm test

# Test just the DuckDB connection
npm run test:duckdb

# Run a basic server test
npm run test:simple

# Set up for manual testing
npm run test:setup

# Clean up any leftover test files
npm run clean:tests
```

6. To run the server:

The MCP server can be run in two ways:

```sh
# Automatic database discovery (using Tailpipe CLI)
node dist/index.js

# Or with explicit database path
node dist/index.js /path/to/your/tailpipe.db

# Control log verbosity with environment variable
LOG_LEVEL=DEBUG node dist/index.js
```

When run without arguments, the server will use the Tailpipe CLI to detect your database (`tailpipe connect --output json`). This requires the Tailpipe CLI to be installed and configured.

You can control the server behavior using environment variables:

- `TAILPIPE_MCP_DATABASE_PATH`: Specify the database path (alternative to command line argument)
- `TAILPIPE_MCP_LOG_LEVEL`: Control logging verbosity with these values:
  - `DEBUG`: Show all messages (most verbose)
  - `INFO`: Show informational, warning, and error messages (default)
  - `WARN`: Show only warning and error messages
  - `ERROR`: Show only error messages
  - `SILENT`: Disable all logging
- `TAILPIPE_MCP_DEBUG`: Set to 'true' to enable additional debug logging for Tailpipe CLI interactions

Example using environment variables:
```sh
TAILPIPE_MCP_DATABASE_PATH=/path/to/db.db TAILPIPE_MCP_LOG_LEVEL=DEBUG node dist/index.js
```

7. To use your local development version with Claude Desktop, update your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "tailpipe": {
      "command": "node",
      "args": [
        "/path/to/your/workspace/dist/index.js",
        "/path/to/your/tailpipe.db"
      ]
    }
  }
}
```

Replace `/path/to/your/workspace` with the absolute path to your local development directory. For example, if you cloned the repository to `~/src/tailpipe-mcp`, you would use `~/src/tailpipe-mcp/dist/index.js`.

8. For local development with Cursor, update your `~/.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "tailpipe": {
      "name": "Tailpipe",
      "description": "Query Tailpipe data",
      "command": "~/src/tailpipe-mcp/dist/index.js"
    }
  }
}
```

## Testing with MCP Inspector

The MCP Inspector is helpful for testing and debugging. To test your local development version:

```sh
npx @modelcontextprotocol/inspector dist/index.js

# Or with explicit database path:
npx @modelcontextprotocol/inspector dist/index.js /path/to/your/tailpipe.db
```

## Open Source & Contributing

This repository is published under the [Apache 2.0 license](https://www.apache.org/licenses/LICENSE-2.0). Please see our [code of conduct](https://github.com/turbot/.github/blob/main/CODE_OF_CONDUCT.md). We look forward to collaborating with you!

[Tailpipe](https://tailpipe.io) is a product produced from this open source software, exclusively by [Turbot HQ, Inc](https://turbot.com). It is distributed under our commercial terms. Others are allowed to make their own distribution of the software, but they cannot use any of the Turbot trademarks, cloud services, etc. You can learn more in our [Open Source FAQ](https://turbot.com/open-source).

## Get Involved

**[Join #tailpipe on Slack →](https://turbot.com/community/join)**

Want to help but don't know where to start? Pick up one of the `help wanted` issues:
* [Tailpipe](https://github.com/turbot/tailpipe/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22)
* [Tailpipe MCP](https://github.com/turbot/tailpipe-mcp/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22)