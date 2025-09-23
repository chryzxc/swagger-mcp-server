import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadSwagger } from "../services/swaggerLoader.js";
import { OpenAPIV3 } from "openapi-types";

export function registerListEndpointsTool(server: McpServer) {
  server.registerTool(
    "listEndpoints",
    {
      title: "List Endpoints",
      description: "Lists down all the endpoints in Swagger spec",
    },
    async () => {
      const spec = await loadSwagger();
      const endpoints: string[] = [];

      for (const [path, methods] of Object.entries(spec.paths || {})) {
        for (const [method] of Object.entries<OpenAPIV3.SchemaObject>(
          methods
        )) {
          endpoints.push(`${method.toUpperCase()} ${path}`);
        }
      }

      if (endpoints.length === 0) {
        return {
          content: [{ type: "text", text: `No endpoints found.` }],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Found endpoints:\n${endpoints.join("\n")}`,
          },
        ],
      };
    }
  );
}
