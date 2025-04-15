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

## Capabilities

### Tools

- **steampipe_query**
  - Query cloud and security logs with SQL.
  - For best performance: use CTEs instead of joins, limit columns requested.
  - All queries are read-only and use PostgreSQL syntax.
  - Input: `sql` (string): The SQL query to execute using PostgreSQL syntax

- **steampipe_table_list**
  - List all available Steampipe tables.
  - Optional input: `schema` (string): Filter tables by specific schema
  - Optional input: `filter` (string): Filter tables by ILIKE pattern (e.g. '%ec2%')

- **steampipe_table_show**
  - Get detailed information about a specific table, including column definitions, data types, and descriptions.
  - Input: `name` (string): The name of the table to show details for (can be schema qualified e.g. 'aws_account' or 'aws.aws_account')
  - Optional input: `schema` (string): The schema containing the table

- **steampipe_plugin_list**
  - List all Steampipe plugins installed on the system. Plugins provide access to different data sources like AWS, GCP, or Azure.
  - No input parameters required

- **steampipe_plugin_show**
  - Get details for a specific Steampipe plugin installation, including version, memory limits, and configuration.
  - Input: `name` (string): Name of the plugin to show details for

### Prompts

- **best_practices**
  - Best practices for working with Steampipe data
  - Provides detailed guidance on:
    - Response style and formatting conventions
    - Using CTEs (WITH clauses) vs joins
    - SQL syntax and style conventions
    - Column selection and optimization
    - Schema exploration and understanding
    - Query structure and organization
    - Performance considerations and caching
    - Error handling and troubleshooting

### Resources

- **status**
  - Represents the current state of the Steampipe connection
  - Properties include:
    - connection_string: The current database connection string
    - status: The connection state (connected/disconnected)

This resource enables AI tools to check and verify the connection status to your Steampipe instance.

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
        "@turbot/steampipe-mcp"
      ]
    }
  }
}
```

By default, this will connect to your local Steampipe installation at `postgresql://steampipe@localhost:9193/steampipe`. Make sure to run `steampipe service start` first.

To connect to a [Turbot Pipes](https://turbot.com/pipes) workspace instead, add your connection string to the args:

```json
{
  "mcpServers": {
    "steampipe": {
      "command": "npx",
      "args": [
        "-y",
        "@turbot/steampipe-mcp",
        "postgresql://username:abc1-2def-3ghi@workspace-name.usea1.db.pipes.turbot.com:9193/steampipe"
      ]
    }
  }
}
```

### Cursor

To install the Steampipe MCP server in Cursor:

1. Open your Cursor MCP configuration file:
   ```sh
   open ~/.cursor/mcp.json  # On macOS
   # or
   code ~/.cursor/mcp.json  # Using VS Code
   ```

2. Add the following configuration:
   ```json
   {
     "mcpServers": {
       "steampipe": {
         "command": "npx",
         "args": [
           "-y",
           "@turbot/steampipe-mcp"
         ]
       }
     }
   }
   ```

   By default, this will connect to your local Steampipe installation. To connect to a Turbot Pipes workspace instead:

   ```json
   {
     "mcpServers": {
       "steampipe": {
         "command": "npx",
         "args": [
           "-y",
           "@turbot/steampipe-mcp",
           "postgresql://username:abc1-2def-3ghi@workspace-name.usea1.db.pipes.turbot.com:9193/steampipe"
         ]
       }
     }
   }
   ```

3. Save the configuration file and restart Cursor for the changes to take effect.

## Prompting Guide

### Best Practices

The Steampipe MCP includes a pre-built `best_practices` prompt. Running it before running your own prompts will teach the LLM how to work most effectively with Steampipe, including:

- How to explore available data schemas and tables
- When to use specific tables for different resource types
- How to write efficient queries that follow Steampipe conventions
- Best practices for formatting and presenting results

In Cursor, you can run load this prompt through the plug icon in the prompt window.

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

4. To test locally, ensure Steampipe is running and then:
```sh
node dist/index.js postgresql://steampipe@localhost:9193/steampipe
```

5. To use your local development version with Cursor, update your `mcp.json`:
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

[Steampipe](https://steampipe.io) is a product produced from this open source software, exclusively by [Turbot HQ, Inc](https://turbot.com). It is distributed under our commercial terms. Others are allowed to make their own distribution of the software, but they cannot use any of the Turbot trademarks, cloud services, etc. You can learn more in our [Open Source FAQ](https://turbot.com/open-source).

## Get Involved

**[Join #steampipe on Slack →](https://turbot.com/community/join)**

Want to help but don't know where to start? Pick up one of the `help wanted` issues:
* [Steampipe](https://github.com/turbot/steampipe/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22)
* [Steampipe MCP](https://github.com/turbot/steampipe-mcp/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22)