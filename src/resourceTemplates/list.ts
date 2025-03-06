import { ListResourceTemplatesRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

export function setupResourceTemplatesList(server: Server) {
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
} 