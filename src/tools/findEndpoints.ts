import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadSwagger } from "../services/swaggerLoader.js";
import z from "zod";

export function registerFindEndpointsTool(server: McpServer) {
  server.registerTool(
    "findEndpoints",
    {
      title: "Find Endpoints",
      description:
        "Searches the Swagger spec for endpoints matching a keyword in path/summary/tags",
      inputSchema: { keyword: z.string() },
    },
    async ({ keyword }) => {
      const spec = (await loadSwagger()) as any;
      const endpoints: string[] = [];

      for (const [path, methods] of Object.entries<any>(spec.paths || {})) {
        for (const [method, operation] of Object.entries<any>(methods)) {
          if (
            path.includes(keyword) ||
            operation?.summary?.includes(keyword) ||
            (operation?.tags || []).some((t: string) => t.includes(keyword))
          ) {
            endpoints.push(`${method.toUpperCase()} ${path}`);
          }
        }
      }

      if (endpoints.length === 0) {
        return {
          content: [
            { type: "text", text: `No endpoints found for "${keyword}".` },
          ],
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
