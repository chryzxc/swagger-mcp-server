import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadSwagger } from "../services/swaggerLoader.js";
import z from "zod";

export function registerFindEndpointsRelatedToEntityTool(server: McpServer) {
  server.registerTool(
    "findEndpointsRelatedToEntity",
    {
      title: "Find Endpoints Related to Entity",
      description:
        "Searches Swagger spec for endpoints related to a given entity (e.g., 'user', 'property'). Matches path, parameters, request/response schemas, and descriptions.",
      inputSchema: { entity: z.string() },
    },
    async ({ entity }) => {
      const spec = await loadSwagger();

      const matches = [];

      for (const [path, methods] of Object.entries(spec.paths)) {
        for (const [method, details] of Object.entries(methods as any)) {
          const combined = [
            path,
            JSON.stringify((details as any).parameters || []),
            (details as any).summary || "",
            (details as any).description || "",
            JSON.stringify((details as any).requestBody || {}),
            JSON.stringify((details as any).responses || {}),
          ]
            .join(" ")
            .toLowerCase();

          if (combined.includes(entity.toLowerCase())) {
            matches.push({
              method: method.toUpperCase(),
              path,
              summary: (details as any).summary || "",
              description: (details as any).description || "",
            });
          }
        }
      }

      if (!matches.length) {
        return {
          content: [
            {
              type: "text",
              text: `No endpoints found related to "${entity}".`,
            },
          ],
        };
      }

      const formatted = matches
        .map(
          (e) =>
            `${e.method} ${e.path}\nSummary: ${e.summary}\nDescription: ${e.description}`
        )
        .join("\n\n");

      return {
        content: [{ type: "text", text: formatted }],
      };
    }
  );
}
