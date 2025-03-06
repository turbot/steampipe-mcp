#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListPromptsRequestSchema, ListToolsRequestSchema, ReadResourceRequestSchema, GetPromptRequestSchema, ListResourceTemplatesRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import pg from "pg";
var PromptName;
(function (PromptName) {
    PromptName["LIST_TABLES"] = "list_tables";
})(PromptName || (PromptName = {}));
const server = new Server({
    name: "steampipe",
    version: "0.1.0",
}, {
    capabilities: {
        prompts: {},
        resources: {},
        tools: {},
    },
});
const args = process.argv.slice(2);
if (args.length === 0) {
    console.error("Please provide a database URL as a command-line argument");
    process.exit(1);
}
const databaseUrl = args[0];
const resourceBaseUrl = new URL(databaseUrl);
resourceBaseUrl.protocol = "postgres:";
resourceBaseUrl.password = "";
const pool = new pg.Pool({
    connectionString: databaseUrl,
});
const SCHEMA_PATH = "schema";
server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return {
        resourceTemplates: [
            {
                uriTemplate: "postgres://schema/{name}",
                name: "Schema",
                description: "Get information about a database schema including its tables",
                parameters: [
                    {
                        name: "name",
                        description: "The name of the schema to query",
                    },
                ],
            },
            {
                uriTemplate: "postgres://table/{schema}/{name}",
                name: "Table",
                description: "Get information about a table including its column definitions",
                parameters: [
                    {
                        name: "schema",
                        description: "The schema containing the table",
                    },
                    {
                        name: "name",
                        description: "The name of the table to query",
                    },
                ],
            },
        ],
    };
});
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const schemaPattern = /^postgres:\/\/schema\/([^\/]+)$/;
    const tablePattern = /^postgres:\/\/table\/([^\/]+)\/([^\/]+)$/;
    const schemaMatch = request.params.uri.match(schemaPattern);
    const tableMatch = request.params.uri.match(tablePattern);
    if (!schemaMatch && !tableMatch) {
        throw new Error(`Invalid resource URI: ${request.params.uri}. Expected format: postgres://schema/{name} or postgres://table/{schema}/{name}`);
    }
    const client = await pool.connect();
    try {
        if (schemaMatch) {
            const schemaName = schemaMatch[1];
            // Query for schema information including its tables
            const result = await client.query(`SELECT 
           t.table_name, 
           t.table_type,
           pg_catalog.obj_description(format('%s.%s', t.table_schema, t.table_name)::regclass::oid, 'pg_class') as description
         FROM information_schema.tables t
         WHERE t.table_schema = $1 
         AND t.table_schema NOT IN ('information_schema', 'pg_catalog')`, [schemaName]);
            if (result.rowCount === 0) {
                throw new Error(`Schema not found: ${schemaName}`);
            }
            return {
                contents: [
                    {
                        uri: request.params.uri,
                        mimeType: "application/json",
                        text: JSON.stringify({
                            schema: schemaName,
                            tables: result.rows.map(row => ({
                                name: row.table_name,
                                type: row.table_type,
                                description: row.description,
                            })),
                        }, null, 2),
                    },
                ],
            };
        }
        // Must be a table match since we checked above
        if (!tableMatch) {
            // This should never happen due to the check above, but TypeScript doesn't know that
            throw new Error('Unexpected error: tableMatch is null');
        }
        const [schemaName, tableName] = [tableMatch[1], tableMatch[2]];
        // First check if the schema exists
        const schemaResult = await client.query(`SELECT 1 
       FROM information_schema.schemata 
       WHERE schema_name = $1 
       AND schema_name NOT IN ('information_schema', 'pg_catalog')`, [schemaName]);
        if (schemaResult.rowCount === 0) {
            throw new Error(`Schema not found: ${schemaName}`);
        }
        // Get table info and columns
        const tableResult = await client.query(`SELECT pg_catalog.obj_description(format('%s.%s', $1, $2)::regclass::oid, 'pg_class') as description`, [schemaName, tableName]);
        const columnResult = await client.query(`SELECT 
         c.column_name,
         c.data_type,
         pg_catalog.col_description(format('%s.%s', c.table_schema, c.table_name)::regclass::oid, c.ordinal_position) as description
       FROM information_schema.columns c
       WHERE c.table_schema = $1 AND c.table_name = $2
       ORDER BY c.ordinal_position`, [schemaName, tableName]);
        if (columnResult.rowCount === 0) {
            throw new Error(`Table not found: ${tableName} in schema ${schemaName}`);
        }
        return {
            contents: [
                {
                    uri: request.params.uri,
                    mimeType: "application/json",
                    text: JSON.stringify({
                        schema: schemaName,
                        table: tableName,
                        description: tableResult.rows[0]?.description,
                        columns: columnResult.rows.map(row => ({
                            name: row.column_name,
                            type: row.data_type,
                            description: row.description,
                        })),
                    }, null, 2),
                },
            ],
        };
    }
    finally {
        client.release();
    }
});
server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
        prompts: [
            {
                name: PromptName.LIST_TABLES,
                description: "Get help with querying Steampipe for a list of available tables",
            },
        ],
    };
});
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name } = request.params;
    if (name === PromptName.LIST_TABLES) {
        return {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: "How do I see what tables are available in Steampipe?",
                    },
                },
                {
                    role: "assistant",
                    content: {
                        type: "text",
                        text: "To see all available tables in Steampipe, you can run this SQL query:\n\nSELECT table_schema, table_name\nFROM information_schema.tables\nWHERE table_schema NOT IN ('information_schema', 'pg_catalog');\n\nThis will show you all the tables across all installed plugins. The table_schema typically corresponds to the plugin name (e.g., 'aws', 'github', etc.).",
                    },
                },
            ],
        };
    }
    throw new Error(`Unknown prompt: ${name}`);
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "query",
                description: "Run a read-only SQL query",
                inputSchema: {
                    type: "object",
                    properties: {
                        sql: { type: "string" },
                    },
                },
            },
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "query") {
        const sql = request.params.arguments?.sql;
        const client = await pool.connect();
        try {
            await client.query("BEGIN TRANSACTION READ ONLY");
            const result = await client.query(sql);
            return {
                content: [{ type: "text", text: JSON.stringify(result.rows, null, 2) }],
                isError: false,
            };
        }
        catch (error) {
            throw error;
        }
        finally {
            client
                .query("ROLLBACK")
                .catch((error) => console.warn("Could not roll back transaction:", error));
            client.release();
        }
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
});
async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
runServer().catch(console.error);
