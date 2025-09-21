import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadSwagger } from "../services/swaggerLoader.js";

export function registerListEndpointsTool(server: McpServer) {
  server.registerTool(
    "listEndpoints",
    {
      title: "List Endpoints",
      description: "Lists down all the endpoints in Swagger spec",
    },
    async () => {
      const spec = (await loadSwagger()) as any;
      const endpoints: string[] = [];

      for (const [path, methods] of Object.entries<any>(spec.paths || {})) {
        for (const [method] of Object.entries<any>(methods)) {
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
