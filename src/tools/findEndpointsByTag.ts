import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadSwagger } from "../services/swaggerLoader.js";
import z from "zod";
import { OpenAPIV3 } from "openapi-types";

export function registerFindEndpointsByTagTool(server: McpServer) {
  server.registerTool(
    "findEndpointsByTag",
    {
      title: "Find Endpoints By Tag",
      description: "Searches the Swagger spec for endpoints using tag",
      inputSchema: { tag: z.string() },
    },
    async ({ tag }) => {
      const spec = await loadSwagger();
      const endpoints: string[] = [];

      for (const [path, methods] of Object.entries(spec.paths || {})) {
        for (const [
          method,
          operation,
        ] of Object.entries<OpenAPIV3.OperationObject>(methods)) {
          if ((operation?.tags || []).some((t: string) => t.includes(tag))) {
            endpoints.push(`${method.toUpperCase()} ${path}`);
          }
        }
      }

      if (endpoints.length === 0) {
        return {
          content: [{ type: "text", text: `No endpoints found for "${tag}".` }],
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
