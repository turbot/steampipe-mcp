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

### Prompts

- **best_practices**
  - Best practices for working with Steampipe data
  - Provides detailed guidance on:
    - How to explore available data
    - When to use specific tables
    - Query structure and optimization
    - Response formatting
    - Performance considerations

### Tools

- **query**
  - Execute read-only SQL queries against the connected Steampipe database
  - Input: `sql` (string): The SQL query to execute
  - All queries are executed within a READ ONLY transaction

- **list_tables**
  - List available tables in the database
  - Optional input: `schema` (string): Filter by schema name
  - Optional input: `filter` (string): Filter tables by name pattern

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

- **clear_cache**
  - Clear any cached database information
  - No input parameters required

### Resource Templates

The Steampipe MCP includes resource templates that define how to interact with different types of resources. Currently supported resource types:

- **schema**
  - Represents a Steampipe schema
  - Properties include name, description, and tables

- **table**
  - Represents a Steampipe table
  - Properties include name, description, columns, and relationships

Resource templates enable structured access to Steampipe metadata, making it easier for AI tools to understand and navigate your data.

## Installation

### Claude Desktop

[How to use MCP servers with Claude Desktop →](https://modelcontextprotocol.io/quickstart/user)

Add the following configuration to the "mcpServers" section of your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "steampipe": {
      "command": "npx",
      "args": [
        "-y",
        "github:turbot/steampipe-mcp",
        "postgresql://steampipe@localhost:9193/steampipe"
      ]
    }
  }
}
```

You can use any Steampipe database connection above, the default shown is for a local instance. To run Steampipe locally use `steampipe service start`. You can also connect directly to a [Turbot Pipes](https://turbot.com/pipes) Steampipe database.

## Prompting Guide

### Best Practices

The Steampipe MCP includes a pre-built `best_practices` prompt. Running it before running your own prompts will teach the LLM how to work most effectively with Steampipe, including:

- How to explore available data schemas and tables
- When to use specific tables for different resource types
- How to write efficient queries that follow Steampipe conventions
- Best practices for formatting and presenting results

In Claude Desktop, you can run load this prompt through the plug icon in the prompt window.

### Example Prompts

Each prompt below is designed to work with Steampipe's table structure, where each resource type (buckets, instances, etc.) has its own table.

```
List 10 S3 buckets and show me their encryption settings
```

```
Find any IAM users with access keys older than 30 days
```

```
What are my most expensive EC2 instances?
```

```
Analyze my S3 buckets for security risks including public access, logging configuration, and encryption settings
```

Remember to:
- Ask about specific resource types (e.g., EC2 instances, S3 buckets, IAM users)
- Be clear about which regions or time periods you're interested in
- Start with simple questions about one resource type
- Add more complexity or conditions after seeing the initial results

Claude will:
- Choose the appropriate Steampipe tables for your request
- Write efficient SQL queries behind the scenes
- Format the results in a clear, readable way
- Provide insights and recommendations based on best practices

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